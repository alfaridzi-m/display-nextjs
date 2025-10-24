const getWaveColor = (category) => {
    const colors = {
        'Tenang': 'text-blue-400',
        'Rendah': 'text-green-500',
        'Sedang': 'text-yellow-500',
        'Tinggi': 'text-orange-500',
        'Sangat Tinggi': 'text-red-500',
        'Ekstrem': 'text-purple-600',
    };
    return colors[category] || 'text-gray-400';
};
export default getWaveColor;