const windDirectionToDegrees = (direction) => {
    const directions = {
        'Utara': 0, 'N': 0,
        'Timur Laut': 45, 'NE': 45,
        'Timur': 90, 'E': 90,
        'Tenggara': 135, 'SE': 135,
        'Selatan': 180, 'S': 180,
        'Barat Daya': 225, 'SW': 225,
        'Barat': 270, 'W': 270,
        'Barat Laut': 315, 'NW': 315,
    };
    return directions[direction] || 0;
};
export default windDirectionToDegrees