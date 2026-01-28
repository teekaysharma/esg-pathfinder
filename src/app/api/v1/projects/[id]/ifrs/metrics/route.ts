import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// IFRS Standards metrics definitions
const IFRS_METRICS = {
  // IFRS S1: General Requirements for Sustainability-related Financial Disclosures
  IFRS_S1: {
    name: "IFRS S1: General Requirements",
    disclosures: [
      { code: "IFRS_S1_1", name: "Governance oversight of sustainability matters", type: "text", required: true },
      { code: "IFRS_S1_2", name: "Management's role in sustainability governance", type: "text", required: true },
      { code: "IFRS_S1_3", name: "Sustainability-related risk management processes", type: "text", required: true },
      { code: "IFRS_S1_4", name: "Sustainability strategy and decision making", type: "text", required: true },
      { code: "IFRS_S1_5", name: "Sustainability policies and commitments", type: "text", required: true },
      { code: "IFRS_S1_6", name: "Stakeholder engagement processes", type: "text", required: true },
      { code: "IFRS_S1_7", name: "Sustainability-related targets and goals", type: "text", required: true },
      { code: "IFRS_S1_8", name: "Sustainability metrics and KPIs", type: "number", required: true }
    ]
  },

  // IFRS S2: Climate-related Disclosures
  IFRS_S2: {
    name: "IFRS S2: Climate-related Disclosures",
    disclosures: [
      { code: "IFRS_S2_1", name: "Climate-related governance oversight", type: "text", required: true },
      { code: "IFRS_S2_2", name: "Climate-related strategy and impacts", type: "text", required: true },
      { code: "IFRS_S2_3", name: "Climate risk management processes", type: "text", required: true },
      { code: "IFRS_S2_4", name: "Climate-related metrics and targets", type: "number", required: true },
      { code: "IFRS_S2_5", name: "Scope 1 GHG emissions (tCO2e)", type: "number", required: true, unit: "tCO2e" },
      { code: "IFRS_S2_6", name: "Scope 2 GHG emissions (tCO2e)", type: "number", required: true, unit: "tCO2e" },
      { code: "IFRS_S2_7", name: "Scope 3 GHG emissions (tCO2e)", type: "number", required: false, unit: "tCO2e" },
      { code: "IFRS_S2_8", name: "Climate risk exposure assessment", type: "currency", required: true, unit: "USD" },
      { code: "IFRS_S2_9", name: "Climate-related capital expenditures", type: "currency", required: true, unit: "USD" },
      { code: "IFRS_S2_10", name: "Climate-related financial impacts", type: "currency", required: true, unit: "USD" }
    ]
  },

  // IFRS S3: Nature-related Risks and Opportunities (Proposed)
  IFRS_S3: {
    name: "IFRS S3: Nature-related Risks and Opportunities",
    disclosures: [
      { code: "IFRS_S3_1", name: "Nature-related governance oversight", type: "text", required: false },
      { code: "IFRS_S3_2", name: "Nature dependencies and impacts", type: "text", required: false },
      { code: "IFRS_S3_3", name: "Ecosystem services valuation", type: "currency", required: false, unit: "USD" },
      { code: "IFRS_S3_4", name: "Biodiversity impact metrics", type: "number", required: false },
      { code: "IFRS_S3_5", name: "Nature-related risk assessment", type: "text", required: false }
    ]
  },

  // IFRS S4: Human Rights and Social (Proposed)
  IFRS_S4: {
    name: "IFRS S4: Human Rights and Social",
    disclosures: [
      { code: "IFRS_S4_1", name: "Human rights policy commitments", type: "text", required: false },
      { code: "IFRS_S4_2", name: "Human rights due diligence processes", type: "text", required: false },
      { code: "IFRS_S4_3", name: "Social impact assessment", type: "text", required: false },
      { code: "IFRS_S4_4", name: "Community engagement investments", type: "currency", required: false, unit: "USD" },
      { code: "IFRS_S4_5", name: "Workplace diversity metrics", type: "percentage", required: false }
    ]
  },

  // IFRS S5: Human Resource Management (Proposed)
  IFRS_S5: {
    name: "IFRS S5: Human Resource Management",
    disclosures: [
      { code: "IFRS_S5_1", name: "Workforce composition and demographics", type: "number", required: false },
      { code: "IFRS_S5_2", name: "Employee training and development hours", type: "number", required: false },
      { code: "IFRS_S5_3", name: "Employee turnover rate", type: "percentage", required: false },
      { code: "IFRS_S5_4", name: "Health and safety incident rate", type: "number", required: false },
      { code: "IFRS_S5_5", name: "Living wage compliance", type: "percentage", required: false }
    ]
  },

  // IFRS S6: Pollution and Resources (Proposed)
  IFRS_S6: {
    name: "IFRS S6: Pollution and Resources",
    disclosures: [
      { code: "IFRS_S6_1", name: "Air pollution emissions (tons)", type: "number", required: false, unit: "tons" },
      { code: "IFRS_S6_2", name: "Water withdrawal (cubic meters)", type: "number", required: false, unit: "m³" },
      { code: "IFRS_S6_3", name: "Waste generation (tons)", type: "number", required: false, unit: "tons" },
      { code: "IFRS_S6_4", name: "Recycling rate", type: "percentage", required: false },
      { code: "IFRS_S6_5", name: "Environmental compliance incidents", type: "number", required: false }
    ]
  },

  // IFRS S7: Circular Economy (Proposed)
  IFRS_S7: {
    name: "IFRS S7: Circular Economy",
    disclosures: [
      { code: "IFRS_S7_1", name: "Circular economy strategy", type: "text", required: false },
      { code: "IFRS_S7_2", name: "Recycled content percentage", type: "percentage", required: false },
      { code: "IFRS_S7_3", "name": "Product recyclability rate", type: "percentage", required: false },
      { code: "IFRS_S7_4", name: "Waste reduction initiatives", type: "text", required: false },
      { code: "IFRS_S7_5", name: "Circular economy investments", type: "currency", required: false, unit: "USD" }
    ]
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
    const standard = searchParams.get('standard'); // IFRS_S1, IFRS_S2, etc.

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get existing IFRS data points for the project
    const existingDataPoints = await db.eSGDataPoint.findMany({
      where: {
        projectId: projectId,
        metricCode: { startsWith: 'IFRS_' }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter metrics based on query parameters
    let metrics = IFRS_METRICS;
    if (standard && IFRS_METRICS[standard as keyof typeof IFRS_METRICS]) {
      metrics = { [standard]: IFRS_METRICS[standard as keyof typeof IFRS_METRICS] } as any;
    }

    return NextResponse.json({
      success: true,
      metrics,
      existingDataPoints,
      summary: {
        totalMetrics: Object.values(metrics).reduce((acc, std) => acc + std.disclosures.length, 0),
        dataPointsCollected: existingDataPoints.length,
        completionRate: existingDataPoints.length > 0 ? 
          (existingDataPoints.filter(dp => dp.validationStatus === 'VALIDATED').length / existingDataPoints.length * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Get IFRS metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve IFRS metrics' },
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
    let category = 'IFRS';
    let subcategory = 'IFRS Standards';
    
    if (metricCode.startsWith('IFRS_S1')) {
      subcategory = 'IFRS S1: General Requirements';
    } else if (metricCode.startsWith('IFRS_S2')) {
      subcategory = 'IFRS S2: Climate-related Disclosures';
      category = 'ENVIRONMENTAL';
    } else if (metricCode.startsWith('IFRS_S3')) {
      subcategory = 'IFRS S3: Nature-related Risks';
      category = 'ENVIRONMENTAL';
    } else if (metricCode.startsWith('IFRS_S4')) {
      subcategory = 'IFRS S4: Human Rights and Social';
      category = 'SOCIAL';
    } else if (metricCode.startsWith('IFRS_S5')) {
      subcategory = 'IFRS S5: Human Resource Management';
      category = 'SOCIAL';
    } else if (metricCode.startsWith('IFRS_S6')) {
      subcategory = 'IFRS S6: Pollution and Resources';
      category = 'ENVIRONMENTAL';
    } else if (metricCode.startsWith('IFRS_S7')) {
      subcategory = 'IFRS S7: Circular Economy';
      category = 'ENVIRONMENTAL';
    }

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
        metricName: getIFRSMetricName(metricCode),
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
      message: 'IFRS metric data saved successfully'
    });

  } catch (error) {
    console.error('Save IFRS metric error:', error);
    return NextResponse.json(
      { error: 'Failed to save IFRS metric data' },
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
    console.error('Batch update IFRS metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to update IFRS metrics' },
      { status: 500 }
    );
  }
}

function getIFRSMetricName(metricCode: string): string {
  // Search through all IFRS metrics to find the name
  for (const standard of Object.values(IFRS_METRICS)) {
    const disclosure = standard.disclosures.find(d => d.code === metricCode);
    if (disclosure) {
      return disclosure.name;
    }
  }
  return metricCode; // Fallback to code if not found
}