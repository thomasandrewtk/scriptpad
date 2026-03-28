import { Extension } from "@tiptap/react";

/**
 * Extended keyboard shortcuts for script editing.
 * Consolidates all custom keybindings into a single extension.
 */
export const KeyboardShortcuts = Extension.create({
  name: "keyboardShortcuts",

  addKeyboardShortcuts() {
    return {
      // Insert sections
      "Mod-Shift-h": ({ editor }) => {
        editor.commands.insertContent({
          type: "scriptSection",
          attrs: { sectionType: "hook" },
          content: [{ type: "paragraph" }],
        });
        return true;
      },
      "Mod-Shift-b": ({ editor }) => {
        editor.commands.insertContent({
          type: "scriptSection",
          attrs: { sectionType: "body" },
          content: [{ type: "paragraph" }],
        });
        return true;
      },
      "Mod-Shift-c": ({ editor }) => {
        editor.commands.insertContent({
          type: "scriptSection",
          attrs: { sectionType: "cta" },
          content: [{ type: "paragraph" }],
        });
        return true;
      },

      // Insert scene note
      "Mod-Shift-n": ({ editor }) => {
        editor.commands.insertContent({
          type: "sceneNote",
          attrs: { text: "", noteType: "broll" },
        });
        return true;
      },

      // Divider
      "Mod-Shift-minus": ({ editor }) => {
        editor.chain().focus().setHorizontalRule().run();
        return true;
      },

      // Insert line variant from current paragraph
      "Mod-Shift-v": ({ editor }) => {
        // Get current paragraph text
        const { $from } = editor.state.selection;
        const parent = $from.parent;
        if (parent.type.name === "paragraph") {
          const text = parent.textContent;
          // Replace current paragraph with a line variant containing the text
          const start = $from.before();
          const end = $from.after();
          editor.view.dispatch(
            editor.state.tr.replaceWith(
              start,
              end,
              editor.state.schema.nodes.lineVariant!.create({
                variants: [text, ""],
                activeIndex: 0,
              }),
            ),
          );
          return true;
        }
        return false;
      },

      // Section reordering: Cmd+Alt+Up/Down to swap section positions
      "Mod-Alt-ArrowUp": ({ editor }) => {
        const { $from } = editor.state.selection;

        // Walk up to find the scriptSection node
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === "scriptSection") {
            const pos = $from.before(depth);
            const parent = $from.node(depth - 1);
            const indexInParent = $from.index(depth - 1);

            if (indexInParent > 0) {
              // Find the previous sibling
              let prevPos = pos;
              let prevSize = 0;
              // Walk backwards to find previous node
              for (let i = 0; i < indexInParent; i++) {
                if (i < indexInParent - 1) {
                  prevPos += parent.child(i).nodeSize;
                } else {
                  prevSize = parent.child(i).nodeSize;
                }
              }
              const prevNodeStart = pos - prevSize;

              // Swap: delete current, insert before previous
              const tr = editor.state.tr;
              const currentNode = node;
              const currentEnd = pos + currentNode.nodeSize;

              tr.delete(pos, currentEnd);
              tr.insert(prevNodeStart, currentNode);
              editor.view.dispatch(tr);
              return true;
            }
            break;
          }
        }
        return false;
      },

      "Mod-Alt-ArrowDown": ({ editor }) => {
        const { $from } = editor.state.selection;

        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === "scriptSection") {
            const pos = $from.before(depth);
            const parent = $from.node(depth - 1);
            const indexInParent = $from.index(depth - 1);

            if (indexInParent < parent.childCount - 1) {
              const nextNode = parent.child(indexInParent + 1);
              const nextPos = pos + node.nodeSize;
              const nextEnd = nextPos + nextNode.nodeSize;

              // Swap: insert current after next, then delete original
              const tr = editor.state.tr;
              tr.insert(nextEnd, node);
              tr.delete(pos, pos + node.nodeSize);
              editor.view.dispatch(tr);
              return true;
            }
            break;
          }
        }
        return false;
      },
    };
  },
});
