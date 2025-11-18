// Test script to verify the summary logic
async function testSummary() {
    // Fetch sample data
    const url = 'https://maritim.bmkg.go.id/marine-data/perairan/P.A.04.json';
    const resp = await fetch(url);
    const data = await resp.json();
    
    console.log('Data issued:', data.issued);
    console.log('Valid from:', data.valid_from);
    console.log('Valid to:', data.valid_to);
    
    // Combine all forecasts
    const allForecasts = [
        ...(data.forecast_day1 || []),
        ...(data['forecast_day2-4'] || [])
    ];
    
    console.log('\nTotal forecasts:', allForecasts.length);
    console.log('First 10 timestamps:');
    allForecasts.slice(0, 10).forEach(f => {
        console.log(`  ${f.time} - ${f.weather} - Wave: ${f.wave_height}m`);
    });
    
    // Test the summary logic
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    console.log('\nToday (00:00 UTC):', today.toISOString());
    
    // Test today 00 UTC (point data)
    const today00 = allForecasts.find(f => {
        const fTime = new Date(f.time);
        return fTime.getUTCFullYear() === today.getUTCFullYear() &&
               fTime.getUTCMonth() === today.getUTCMonth() &&
               fTime.getUTCDate() === today.getUTCDate() &&
               fTime.getUTCHours() === 0;
    });
    console.log('\nToday 00 UTC (point data):', today00 ? today00.time : 'NOT FOUND');
    
    // Test today 12 UTC (6-hour window: 06-12)
    const today12Bucket = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0));
    const today12Start = new Date(today12Bucket);
    today12Start.setUTCHours(today12Start.getUTCHours() - 6);
    
    const today12Forecasts = allForecasts.filter(f => {
        const fTime = new Date(f.time);
        return fTime > today12Start && fTime <= today12Bucket;
    });
    
    console.log(`\nToday 12 UTC (6-hour window: ${today12Start.toISOString()} to ${today12Bucket.toISOString()}):`);
    console.log(`Found ${today12Forecasts.length} forecasts:`);
    today12Forecasts.forEach(f => console.log(`  ${f.time}`));
}

testSummary().catch(console.error);
