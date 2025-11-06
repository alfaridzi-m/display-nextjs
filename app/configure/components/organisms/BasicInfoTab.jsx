// organisms/BasicInfoTab.jsx
import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import { FormField } from '../molecules/FormField';

export const BasicInfoTab = ({ formData, idValidation, handleInputChange }) => {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
          <Icon name="info" className="h-6 w-6" />
          Identitas Display
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="ID Konfigurasi"
            id="id"
            name="id"
            value={formData.id}
            onChange={handleInputChange}
            placeholder="Contoh: bmkg196"
            validation={idValidation}
            pattern="[a-zA-Z0-9]+"
            title="Hanya huruf dan angka (tanpa spasi atau karakter khusus)"
            helpText={[
              'Hanya huruf dan angka, tanpa spasi atau karakter khusus. ID akan terdaftar ke Server dan localStorage dengan key <code class="bg-red-700 px-1 rounded">displayConfigId</code>',
              '<code class="bg-red-700 px-1 rounded animate-pulse">Harap ID disimpan</code> agar tidak perlu melakukan konfigurasi berulang'
            ]}
          />
          
          <FormField
            label="Nama Display"
            id="displayTitle"
            name="displayTitle"
            value={formData.displayTitle}
            onChange={handleInputChange}
            placeholder="Contoh: Display Cuaca Pelabuhan Makassar"
          />
        </div>
      </Card>
    </div>
  );
};
