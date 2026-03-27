import { ScriptEditorPage } from "~/app/_components/editor/script-editor-page";

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ScriptEditorPage scriptId={id} />;
}
