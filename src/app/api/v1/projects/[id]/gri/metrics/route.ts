import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GRI Standard metrics definitions
const GRI_METRICS = {
  // Universal Standards
  UNIVERSAL: {
    GRI_1: {
      name: "GRI 1: Foundation",
      disclosures: [
        { code: "GRI_1_1", name: "Statement of use of the GRI Standards", type: "text", required: true },
        { code: "GRI_1_2", name: "Organizational profile", type: "text", required: true },
        { code: "GRI_1_3", name: "Ethics and integrity", type: "text", required: true }
      ]
    },
    GRI_2: {
      name: "GRI 2: General Disclosures", 
      disclosures: [
        { code: "GRI_2_1", name: "Organizational details", type: "text", required: true },
        { code: "GRI_2_2", name: "Entities included in sustainability statements", type: "text", required: true },
        { code: "GRI_2_3", name: "Activities, value chain and business relationships", type: "text", required: true },
        { code: "GRI_2_6", name: "Activities, value chain and other business relationships", type: "text", required: true },
        { code: "GRI_2_7", name: "Employees", type: "number", required: true },
        { code: "GRI_2_22", name: "Governance structure and composition", type: "text", required: true }
      ]
    },
    GRI_3: {
      name: "GRI 3: Material Topics",
      disclosures: [
        { code: "GRI_3_1", name: "Process to determine material topics", type: "text", required: true },
        { code: "GRI_3_2", name: "List of material topics", type: "array", required: true },
        { code: "GRI_3_3", name: "Management of material topics", type: "text", required: true }
      ]
    }
  },
  
  // Economic Topics
  ECONOMIC: {
    GRI_201: {
      name: "Economic Performance",
      disclosures: [
        { code: "GRI_201_1", name: "Direct economic value generated and distributed", type: "currency", required: true, unit: "USD" },
        { code: "GRI_201_2", name: "Financial implications of climate change", type: "currency", required: false, unit: "USD" },
        { code: "GRI_201_4", name: "Financial assistance from government", type: "currency", required: false, unit: "USD" }
      ]
    },
    GRI_205: {
      name: "Anti-corruption",
      disclosures: [
        { code: "GRI_205_1", name: "Operations assessed for corruption risks", type: "percentage", required: true },
        { code: "GRI_205_2", name: "Communication and training on anti-corruption", type: "percentage", required: true },
        { code: "GRI_205_3", name: "Confirmed incidents of corruption", type: "number", required: true }
      ]
    }
  },

  // Environmental Topics  
  ENVIRONMENTAL: {
    GRI_302: {
      name: "Energy",
      disclosures: [
        { code: "GRI_302_1", name: "Energy consumption within the organization", type: "number", required: true, unit: "GJ" },
        { code: "GRI_302_2", name: "Energy consumption outside the organization", type: "number", required: false, unit: "GJ" },
        { code: "GRI_302_3", name: "Energy intensity", type: "number", required: true, unit: "GJ/revenue" },
        { code: "GRI_302_4", name: "Reduction in energy consumption", type: "percentage", required: false }
      ]
    },
    GRI_305: {
      name: "Emissions",
      disclosures: [
        { code: "GRI_305_1", name: "Direct GHG emissions (Scope 1)", type: "number", required: true, unit: "tCO2e" },
        { code: "GRI_305_2", name: "Energy indirect GHG emissions (Scope 2)", type: "number", required: true, unit: "tCO2e" },
        { code: "GRI_305_3", name: "Other indirect GHG emissions (Scope 3)", type: "number", required: false, unit: "tCO2e" },
        { code: "GRI_305_4", name: "GHG intensity", type: "number", required: true, unit: "tCO2e/revenue" },
        { code: "GRI_305_5", name: "Reduction of GHG emissions", type: "percentage", required: false }
      ]
    },
    GRI_303: {
      name: "Water and Effluents",
      disclosures: [
        { code: "GRI_303_1", name: "Water withdrawal by source", type: "number", required: true, unit: "m³" },
        { code: "GRI_303_2", name: "Water discharge by quality and destination", type: "number", required: true, unit: "m³" },
        { code: "GRI_303_3", name: "Water consumption", type: "number", required: true, unit: "m³" },
        { code: "GRI_303_4", name: "Water recycling and reuse", type: "percentage", required: false }
      ]
    },
    GRI_306: {
      name: "Effluents and Waste",
      disclosures: [
        { code: "GRI_306_1", name: "Waste by type and disposal method", type: "number", required: true, unit: "tonnes" },
        { code: "GRI_306_2", name: "Waste diverted from disposal", type: "percentage", required: false },
        { code: "GRI_306_3", name: "Waste directed to disposal", type: "percentage", required: false }
      ]
    }
  },

  // Social Topics
  SOCIAL: {
    GRI_401: {
      name: "Employment",
      disclosures: [
        { code: "GRI_401_1", name: "New employee hires and turnover", type: "number", required: true },
        { code: "GRI_401_2", name: "Benefits provided to full-time employees", type: "text", required: true },
        { code: "GRI_401_3", name: "Parental leave return rates", type: "percentage", required: false }
      ]
    },
    GRI_403: {
      name: "Occupational Health and Safety",
      disclosures: [
        { code: "GRI_403_1", name: "Occupational health and safety management system", type: "text", required: true },
        { code: "GRI_403_7", name: "Workers covered by OHSMS", type: "percentage", required: true },
        { code: "GRI_403_9", name: "Work-related injuries", type: "number", required: true },
        { code: "GRI_403_10", name: "Work-related ill health", type: "number", required: true }
      ]
    },
    GRI_405: {
      name: "Diversity and Equal Opportunity",
      disclosures: [
        { code: "GRI_405_1", name: "Diversity of governance bodies and employees", type: "percentage", required: true },
        { code: "GRI_405_2", name: "Ratio of salary remuneration women to men", type: "ratio", required: true }
      ]
    }
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // UNIVERSAL, ECONOMIC, ENVIRONMENTAL, SOCIAL
    const standard = searchParams.get('standard'); // GRI_1, GRI_201, etc.

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get existing GRI data points for the project
    const existingDataPoints = await db.eSGDataPoint.findMany({
      where: {
        projectId: projectId,
        metricCode: { startsWith: 'GRI_' }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter metrics based on query parameters
    let metrics = GRI_METRICS;
    if (category && GRI_METRICS[category as keyof typeof GRI_METRICS]) {
      metrics = { [category]: GRI_METRICS[category as keyof typeof GRI_METRICS] } as any;
      
      if (standard && metrics[category][standard as keyof typeof metrics[typeof category]]) {
        metrics = { [category]: { [standard]: metrics[category][standard as keyof typeof metrics[typeof category]] } } as any;
      }
    }

    return NextResponse.json({
      success: true,
      metrics,
      existingDataPoints,
      summary: {
        totalMetrics: Object.values(metrics).reduce((acc, cat) => 
          acc + Object.values(cat).reduce((catAcc, std) => 
            catAcc + std.disclosures.length, 0), 0),
        dataPointsCollected: existingDataPoints.length,
        completionRate: existingDataPoints.length > 0 ? 
          (existingDataPoints.filter(dp => dp.validationStatus === 'VALIDATED').length / existingDataPoints.length * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Get GRI metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve GRI metrics' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;
    const body = await request.json();
    const { metricCode, value, unit, year, period, dataSource, notes } = body;

    // Validate required fields
    if (!metricCode || value === undefined) {
      return NextResponse.json(
        { error: 'Metric code and value are required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Determine category from metric code
    let category = 'OTHER';
    if (metricCode.startsWith('GRI_1') || metricCode.startsWith('GRI_2') || metricCode.startsWith('GRI_3')) {
      category = 'UNIVERSAL';
    } else if (metricCode.startsWith('GRI_2')) {
      category = 'ECONOMIC';
    } else if (metricCode.startsWith('GRI_3')) {
      category = 'ENVIRONMENTAL';
    } else if (metricCode.startsWith('GRI_4')) {
      category = 'SOCIAL';
    }

    // Determine subcategory from standard
    const standardMatch = metricCode.match(/GRI_(\d{3})/);
    const subcategory = standardMatch ? `GRI ${standardMatch[1]}` : 'Unknown';

    // Create or update ESG data point
    const dataPoint = await db.eSGDataPoint.upsert({
      where: {
        projectId_metricCode_year: {
          projectId: projectId,
          metricCode: metricCode,
          year: year || new Date().getFullYear()
        }
      },
      update: {
        value: parseFloat(value),
        unit: unit || null,
        period: period || 'Annual',
        dataSource: dataSource || 'Manual entry',
        confidence: 0.8, // Default confidence
        validationStatus: 'PENDING',
        metadata: notes ? { notes } : null,
        updatedAt: new Date()
      },
      create: {
        projectId: projectId,
        category: category,
        subcategory: subcategory,
        metricName: getMetricName(metricCode),
        metricCode: metricCode,
        value: parseFloat(value),
        unit: unit || null,
        year: year || new Date().getFullYear(),
        period: period || 'Annual',
        dataSource: dataSource || 'Manual entry',
        confidence: 0.8,
        validationStatus: 'PENDING',
        metadata: notes ? { notes } : null
      }
    });

    return NextResponse.json({
      success: true,
      dataPoint,
      message: 'GRI metric data saved successfully'
    });

  } catch (error) {
    console.error('Save GRI metric error:', error);
    return NextResponse.json(
      { error: 'Failed to save GRI metric data' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;
    const body = await request.json();
    const { dataPoints } = body; // Array of data points to batch update

    if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
      return NextResponse.json(
        { error: 'Data points array is required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const results = [];

    for (const dp of dataPoints) {
      try {
        const updated = await db.eSGDataPoint.update({
          where: { id: dp.id },
          data: {
            value: dp.value,
            unit: dp.unit,
            validationStatus: dp.validationStatus,
            confidence: dp.confidence,
            metadata: dp.metadata,
            updatedAt: new Date()
          }
        });
        results.push(updated);
      } catch (error) {
        console.error(`Failed to update data point ${dp.id}:`, error);
        results.push({ id: dp.id, error: 'Update failed' });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.length} data points`
    });

  } catch (error) {
    console.error('Batch update GRI metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to update GRI metrics' },
      { status: 500 }
    );
  }
}

function getMetricName(metricCode: string): string {
  // Search through all metrics to find the name
  for (const category of Object.values(GRI_METRICS)) {
    for (const standard of Object.values(category)) {
      const disclosure = standard.disclosures.find(d => d.code === metricCode);
      if (disclosure) {
        return disclosure.name;
      }
    }
  }
  return metricCode; // Fallback to code if not found
}