# Display Cuaca Maritim - Next.js

A Next.js application for displaying maritime weather information from BMKG (Badan Meteorologi, Klimatologi, dan Geofisika).

## Features

- **Infomet Display**: Maritime weather information dashboard
- **Port Weather**: Display weather conditions for multiple Indonesian ports
- **Maritime Areas (Wilayah Perairan)**: Weather information for maritime regions
- **Interactive Maps**: Leaflet-based interactive maps with port locations
- **Weather Forecasts**: Daily and hourly weather forecasts
- **Tide Charts**: Tidal information visualization
- **Configuration System**: Customizable display configurations for different locations

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (version 18.x or higher recommended)
- **npm** or **yarn** package manager

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd display-nextjs
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

## Configuration

The application uses configuration files located in the `config/` directory to customize displays:

- `bmkg1977.json` - Configuration for BMKG 1977 display
- `bmkg97124.json` - Configuration for BMKG 97124 display
- `s1997.json` - Configuration for S1997 display

Each configuration file includes:
- **Display title**: Custom title for the display
- **Port IDs**: List of ports to display on the main screen
- **Port endpoints**: Additional ports for detailed views
- **Active maritime areas (wilayah_aktif)**: Maritime regions to display
- **Background settings**: Customizable background image
- **Running text**: Scrolling text messages

### Creating a New Configuration

1. Create a new JSON file in the `config/` directory
2. Follow the structure of existing configuration files
3. Access the configuration page at `/configure` to create or edit configurations via the UI

## Running the Application

### Development Mode

Run the development server with hot-reload:

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
# or
yarn start
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
# or
yarn lint
```

## Usage Guide

### 1. Home Page (`/`)

The landing page provides two main options:
- **Infomet**: Access the maritime weather information display
- **Sisfomet**: (Coming soon)

### 2. Configuration Selection (`/config-select`)

Select from available display configurations to load specific settings for different locations or display setups.

### 3. Infomet Display (`/infomet`)

The main weather display page showing:
- Current weather conditions for selected ports
- Maritime area weather information
- Tide charts
- Daily and hourly forecasts
- Interactive map with port locations

**Navigation**:
- Use the sidebar to switch between different ports
- Click on map markers to view port details
- Access different information panels (weather, forecast, tides)

### 4. Configuration Page (`/configure`)

Create or edit display configurations:

**Tabs**:
- **Basic Info**: Set display ID and title
- **Ports**: Select which ports to display
- **Maritime Areas (Wilayah)**: Choose active maritime regions
- **Location**: Set map center coordinates
- **Background**: Configure background image settings

**Steps**:
1. Navigate to `/configure`
2. Fill in the required information in each tab
3. Use the progress indicator to track completion
4. Save the configuration

### 5. Maritime Areas (`/periran`, `/periran2`, `/perairan`)

Alternative views for maritime weather information with different layouts and data presentations.

## Project Structure

```
display-nextjs/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   ├── components/           # React components
│   │   ├── clock.jsx         # Clock component
│   │   ├── weatherpage.jsx   # Weather display page
│   │   ├── portpage.jsx      # Port information page
│   │   ├── perairan.jsx      # Maritime areas component
│   │   └── ...
│   ├── configure/            # Configuration UI
│   ├── infomet/              # Main display page
│   └── hooks/                # Custom React hooks
├── config/                   # Configuration files
├── public/                   # Static assets
│   ├── pelabuhan.geojson     # Port location data
│   ├── wilpro.geojson        # Maritime area boundaries
│   └── icon/                 # Weather icons (Lottie animations)
└── package.json
```

## Key Dependencies

- **Next.js 15.5.2**: React framework for production
- **React 19.1.0**: UI library
- **Leaflet & React-Leaflet**: Interactive maps
- **D3.js**: Data visualization (for charts)
- **Axios**: HTTP client for API requests
- **Day.js**: Date and time manipulation
- **Lottie-react**: Animated weather icons
- **Tailwind CSS 4.x**: Utility-first CSS framework
- **Lucide React**: Icon library

## API Endpoints

The application includes API routes in `app/api/`:
- `/api/configure`: Handle configuration save/load operations

## Customization

### Styling

The project uses Tailwind CSS. Customize styles in:
- `app/globals.css` - Global styles
- Component files - Component-specific styles using Tailwind classes

### Weather Icons

Weather icons are Lottie animations located in `public/icon/`:
- `cerah.json` - Clear sky
- `berawan.json` - Cloudy
- `hujan-ringan.json` - Light rain
- `hujan-sedang.json` - Moderate rain
- `hujan-lebat.json` - Heavy rain
- `hujan-petir.json` - Thunderstorm
- And more...

## Development Tips

1. **Hot Reload**: Changes to code will automatically reload in development mode
2. **Component Development**: Components are located in `app/components/`
3. **State Management**: Uses React hooks for state management
4. **Data Fetching**: Weather data is fetched from BMKG APIs

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can specify a different port:
```bash
PORT=3001 npm run dev
```

### Build Errors

Run the type check build task to identify issues:
```bash
npm run build
```

### Dependencies Issues

If you encounter dependency conflicts:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

When contributing to this project:
1. Follow the existing code structure
2. Use meaningful component and variable names
3. Test your changes in development mode
4. Ensure the build completes without errors

## License

[Add your license information here]

## Support

For issues or questions, please contact the development team or create an issue in the repository.
