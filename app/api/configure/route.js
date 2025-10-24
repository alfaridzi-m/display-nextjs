// app/api/configure/route.js
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Path to store configurations
const CONFIG_DIR = path.join(process.cwd(), 'config');

// Ensure config directory exists
async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    console.error('Error ensuring config directory:', error);
    throw error;
  }
}

// Get file path for a specific config ID
function getConfigFilePath(id) {
  return path.join(CONFIG_DIR, `${id}.json`);
}

// Read a single configuration by ID
async function readConfiguration(id) {
  const filePath = getConfigFilePath(id);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw error;
  }
}

// Read all configurations
async function readAllConfigurations() {
  await ensureConfigDir();
  try {
    const files = await fs.readdir(CONFIG_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const configurations = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const data = await fs.readFile(path.join(CONFIG_DIR, file), 'utf-8');
          return JSON.parse(data);
        } catch (error) {
          console.error(`Error reading ${file}:`, error);
          return null;
        }
      })
    );
    
    return configurations.filter(config => config !== null);
  } catch (error) {
    console.error('Error reading configurations:', error);
    return [];
  }
}

// Write a single configuration
async function writeConfiguration(config) {
  await ensureConfigDir();
  const filePath = getConfigFilePath(config.id);
  await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
}

// Delete a configuration file
async function deleteConfiguration(id) {
  const filePath = getConfigFilePath(id);
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false; // File doesn't exist
    }
    throw error;
  }
}

// GET - Retrieve configuration(s)
// Query params: ?id=configId (optional) - if provided, returns single config, otherwise returns all
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Return specific configuration
      const config = await readConfiguration(id);
      if (!config) {
        return NextResponse.json(
          { error: 'Configuration not found', id },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: config });
    }

    // Return all configurations
    const configurations = await readAllConfigurations();
    return NextResponse.json({ success: true, data: configurations });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve configurations', message: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new configuration
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // Check if ID already exists
    const existingConfig = await readConfiguration(body.id);
    if (existingConfig) {
      return NextResponse.json(
        { error: 'Configuration with this ID already exists. Use PUT to update.' },
        { status: 409 }
      );
    }

    // Add timestamp
    const newConfig = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await writeConfiguration(newConfig);

    return NextResponse.json(
      { success: true, message: 'Configuration created successfully', data: newConfig },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create configuration', message: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update existing configuration
export async function PUT(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // Find existing configuration
    const existingConfig = await readConfiguration(body.id);
    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuration not found. Use POST to create new configuration.' },
        { status: 404 }
      );
    }

    // Update configuration, preserve createdAt
    const updatedConfig = {
      ...body,
      createdAt: existingConfig.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await writeConfiguration(updatedConfig);

    return NextResponse.json(
      { success: true, message: 'Configuration updated successfully', data: updatedConfig },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a configuration
// Query params: ?id=configId (required)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteConfiguration(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Configuration not found', id },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Configuration deleted successfully', id },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete configuration', message: error.message },
      { status: 500 }
    );
  }
}
