import { UploadZone } from "@/components/upload/upload-zone";
import { Form606Table } from "@/components/formulario-606/form-606-table";
import { Form606Header } from "@/components/formulario-606/form-606-header";

export default function Formulario606Page() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Form606Header />
      <UploadZone formulario="606" />
      <Form606Table />
    </div>
  );
}
