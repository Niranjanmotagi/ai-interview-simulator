'use client';

import { useCallback, useEffect, useRef } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import * as Y from 'yjs';
import type {
  ActivityType,
  AwarenessEvent,
  EditorPosition,
  EditorSelection,
} from '@ai-interview/types';

interface Props {
  ydoc: Y.Doc;
  languageId: string;
  readOnly: boolean;
  remoteCursors: Map<string, AwarenessEvent>;
  selfSocketId: string | null;
  onAwareness: (cursor: EditorPosition | null, selection: EditorSelection | null) => void;
  onActivity: (type: ActivityType, meta?: Record<string, unknown>) => void;
}

const injectedColors = new Set<string>();
let styleEl: HTMLStyleElement | null = null;

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ensureColorClass(hex: string): string {
  const key = hex.replace('#', '');
  if (injectedColors.has(key)) {
    return key;
  }
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.dataset.codesync = 'remote-cursors';
    document.head.appendChild(styleEl);
  }
  styleEl.appendChild(
    document.createTextNode(`.rc-sel-${key}{background:${hexToRgba(hex, 0.22)};border-radius:2px;}`),
  );
  injectedColors.add(key);
  return key;
}

interface YjsBinding {
  destroy: () => void;
}

/**
 * Minimal Yjs <-> Monaco text binding using the editor's *own* monaco instance
 * (passed at mount), so Range/edit objects always match the model — avoiding the
 * dual-instance pitfall of y-monaco bundling its own monaco-editor.
 *
 * Remote ops (origin !== local) are translated into model edits; local model
 * edits are translated into a local Yjs transaction. A guard flag prevents the
 * two directions from echoing each other.
 */
function bindYjsToMonaco(
  ydoc: Y.Doc,
  ytext: Y.Text,
  model: MonacoEditor.ITextModel,
  monaco: Monaco,
): YjsBinding {
  let applyingRemote = false;

  const initial = ytext.toString();
  if (model.getValue() !== initial) {
    applyingRemote = true;
    model.setValue(initial);
    applyingRemote = false;
  }

  const onYChange = (event: Y.YTextEvent, transaction: Y.Transaction) => {
    if (transaction.local) {
      return; // our own model->ytext edit; don't reapply
    }
    applyingRemote = true;
    let index = 0;
    for (const op of event.delta) {
      if (op.retain != null) {
        index += op.retain;
      } else if (op.insert != null) {
        const text = typeof op.insert === 'string' ? op.insert : '';
        const pos = model.getPositionAt(index);
        model.applyEdits([
          {
            range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
            text,
            forceMoveMarkers: true,
          },
        ]);
        index += text.length;
      } else if (op.delete != null) {
        const start = model.getPositionAt(index);
        const end = model.getPositionAt(index + op.delete);
        model.applyEdits([
          { range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column), text: '' },
        ]);
      }
    }
    applyingRemote = false;
  };
  ytext.observe(onYChange);

  const modelListener = model.onDidChangeContent((event) => {
    if (applyingRemote) {
      return;
    }
    ydoc.transact(() => {
      // Apply highest offset first so earlier offsets stay valid.
      const changes = [...event.changes].sort((a, b) => b.rangeOffset - a.rangeOffset);
      for (const c of changes) {
        if (c.rangeLength > 0) {
          ytext.delete(c.rangeOffset, c.rangeLength);
        }
        if (c.text.length > 0) {
          ytext.insert(c.rangeOffset, c.text);
        }
      }
    }, 'monaco');
  });

  return {
    destroy() {
      ytext.unobserve(onYChange);
      modelListener.dispose();
    },
  };
}

export function CollaborativeEditor({
  ydoc,
  languageId,
  readOnly,
  remoteCursors,
  selfSocketId,
  onAwareness,
  onActivity,
}: Props) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const bindingRef = useRef<YjsBinding | null>(null);
  const decorationsRef = useRef<MonacoEditor.IEditorDecorationsCollection | null>(null);
  const widgetsRef = useRef<Map<string, MonacoEditor.IContentWidget>>(new Map());
  const lastEmitRef = useRef(0);
  const resizeObsRef = useRef<ResizeObserver | null>(null);

  const handleMount = useCallback<OnMount>(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      monaco.editor.defineTheme('codesync-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0c0d11',
          'editor.lineHighlightBackground': '#ffffff0a',
          'editorLineNumber.foreground': '#3f3f46',
          'editorGutter.background': '#0c0d11',
          'editorIndentGuide.background1': '#ffffff10',
        },
      });
      monaco.editor.setTheme('codesync-dark');

      const model = editor.getModel();
      if (model) {
        bindingRef.current = bindYjsToMonaco(ydoc, ydoc.getText('monaco'), model, monaco);
      }
      decorationsRef.current = editor.createDecorationsCollection();

      // Monaco's built-in automaticLayout can get stuck at a 5x5 fallback inside
      // flex/absolute containers. Drive layout explicitly from the parent box.
      const dom = editor.getDomNode();
      const sizer = dom?.parentElement;
      if (sizer) {
        const relayout = () => editor.layout({ width: sizer.clientWidth, height: sizer.clientHeight });
        relayout();
        requestAnimationFrame(relayout);
        const ro = new ResizeObserver(relayout);
        ro.observe(sizer);
        resizeObsRef.current = ro;
      }

      // Broadcast our cursor/selection (throttled).
      editor.onDidChangeCursorSelection((e) => {
        const now = Date.now();
        if (now - lastEmitRef.current < 45) {
          return;
        }
        lastEmitRef.current = now;
        const sel = e.selection;
        const cursor: EditorPosition = { lineNumber: sel.positionLineNumber, column: sel.positionColumn };
        const selection: EditorSelection | null = sel.isEmpty()
          ? null
          : {
              startLineNumber: sel.startLineNumber,
              startColumn: sel.startColumn,
              endLineNumber: sel.endLineNumber,
              endColumn: sel.endColumn,
            };
        onAwareness(cursor, selection);
      });

      // Activity monitoring.
      editor.onDidPaste((e) => {
        onActivity('paste', { lines: e.range.endLineNumber - e.range.startLineNumber + 1 });
      });
      dom?.addEventListener('copy', () => onActivity('copy'));
      dom?.addEventListener('cut', () => onActivity('cut'));
    },
    [ydoc, onAwareness, onActivity],
  );

  // Keep model language in sync with the room's language.
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (monaco && model) {
      monaco.editor.setModelLanguage(model, languageId);
    }
  }, [languageId]);

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly });
  }, [readOnly]);

  // Render remote cursors (caret + name label as content widgets) and selections.
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const decorations = decorationsRef.current;
    if (!editor || !monaco || !decorations) {
      return;
    }

    const newDecorations: MonacoEditor.IModelDeltaDecoration[] = [];
    const seen = new Set<string>();

    for (const [socketId, awareness] of remoteCursors) {
      if (socketId === selfSocketId || !awareness.cursor) {
        continue;
      }
      seen.add(socketId);
      const colorKey = ensureColorClass(awareness.color);

      if (awareness.selection) {
        const s = awareness.selection;
        newDecorations.push({
          range: new monaco.Range(s.startLineNumber, s.startColumn, s.endLineNumber, s.endColumn),
          options: { className: `rc-sel-${colorKey}` },
        });
      }

      const widget = upsertCursorWidget(editor, widgetsRef.current, socketId, awareness, monaco);
      editor.layoutContentWidget(widget);
    }

    decorations.set(newDecorations);

    for (const [socketId, widget] of widgetsRef.current) {
      if (!seen.has(socketId)) {
        editor.removeContentWidget(widget);
        widgetsRef.current.delete(socketId);
      }
    }
  }, [remoteCursors, selfSocketId]);

  useEffect(() => {
    return () => {
      resizeObsRef.current?.disconnect();
      resizeObsRef.current = null;
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, []);

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      defaultLanguage={languageId}
      onMount={handleMount}
      loading={<div className="flex h-full items-center justify-center text-sm text-white/40">Loading editor…</div>}
      options={{
        fontSize: 13.5,
        fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
        fontLigatures: true,
        minimap: { enabled: false },
        smoothScrolling: true,
        cursorSmoothCaretAnimation: 'on',
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false,
        renderLineHighlight: 'line',
        roundedSelection: true,
        automaticLayout: false, // we drive layout via ResizeObserver (see handleMount)
        tabSize: 2,
        lineNumbersMinChars: 3,
      }}
    />
  );
}

function upsertCursorWidget(
  editor: MonacoEditor.IStandaloneCodeEditor,
  widgets: Map<string, MonacoEditor.IContentWidget>,
  socketId: string,
  awareness: AwarenessEvent,
  monaco: Monaco,
): MonacoEditor.IContentWidget {
  const position = {
    position: { lineNumber: awareness.cursor!.lineNumber, column: awareness.cursor!.column },
    preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
  };

  const existing = widgets.get(socketId);
  if (existing) {
    (existing as { getPosition: () => unknown }).getPosition = () => position;
    return existing;
  }

  const node = document.createElement('div');
  node.style.cssText = 'position:relative;pointer-events:none;z-index:30;';
  node.innerHTML = `
    <div style="position:absolute;left:0;top:0;width:2px;height:18px;background:${awareness.color};"></div>
    <div style="position:absolute;left:0;top:-18px;white-space:nowrap;font:600 10px/1.4 var(--font-inter,system-ui);color:#0A0A0A;background:${awareness.color};padding:1px 6px;border-radius:4px 4px 4px 0;box-shadow:0 1px 4px rgba(0,0,0,0.4);">${escapeHtml(awareness.name)}</div>
  `;

  const widget: MonacoEditor.IContentWidget = {
    getId: () => `remote-cursor-${socketId}`,
    getDomNode: () => node,
    getPosition: () => position,
  };
  widgets.set(socketId, widget);
  editor.addContentWidget(widget);
  return widget;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string;
  });
}
