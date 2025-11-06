// organisms/BackgroundTab.jsx
import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import { Button } from '../atoms/Button';

export const BackgroundTab = ({ 
  handleImageUpload, 
  handleRemoveImage 
}) => {
  const hasImage = typeof window !== 'undefined' && localStorage.getItem('imageBackground');

  return (
    <div className="space-y-6">
      <Card gradient="from-purple-900/20 to-pink-900/20" borderColor="border-purple-500/30">
        <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
          <Icon name="image" className="h-6 w-6" />
          Upload Gambar Latar Belakang
        </h3>
        
        <div className="space-y-4">
          <div className="bg-purple-900/20 border border-purple-500/40 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-300 mb-2">Informasi</h4>
            <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
              <h2 className="font-bold text-sm">
                Pengaturan latar belakang hanya akan berhasil jika proses pembuatan ID dilakukan di PC display
              </h2>
              <li>Gambar akan disimpan di local storage browser dengan key <code className="bg-gray-700 px-1 rounded">imageBackground</code></li>
              <li>Format yang didukung: JPG, PNG, GIF, WebP, dll.</li>
              <li>Ukuran maksimal: 5 MB</li>
              <li>Gambar akan tetap tersimpan hingga dilakukan penghapusan browser data</li>
              <li>Untuk mengganti latar belakang, cukup unggah gambar baru di halaman ini</li>
            </ul>
          </div>

          <div className="bg-gray-900/50 border-2 border-dashed border-purple-500/50 rounded-lg p-6 hover:border-purple-500 transition-colors">
            {hasImage ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-gray-800">
                  <img 
                    src={localStorage.getItem('imageBackground')} 
                    alt="Background preview" 
                    className="w-full h-auto object-contain max-h-96"
                  />
                </div>
                
                <div className="flex gap-3">
                  <label 
                    htmlFor="background-image-upload" 
                    className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Icon name="upload" />
                    Ganti Gambar
                  </label>
                  <input
                    id="background-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="danger"
                    onClick={handleRemoveImage}
                    icon={<Icon name="close" />}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="image" className="h-16 w-16 mx-auto mb-4 text-purple-400 opacity-50" />
                <p className="text-gray-400 mb-4">Belum ada gambar yang diunggah</p>
                <label 
                  htmlFor="background-image-upload" 
                  className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Icon name="upload" />
                  Pilih Gambar
                </label>
                <input
                  id="background-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-3">
                  Klik untuk memilih gambar dari komputer Anda
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
