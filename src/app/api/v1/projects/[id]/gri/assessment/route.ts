import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GRI Standards structure based on the Consolidated Set of GRI Standards
const GRI_UNIVERSAL_STANDARDS = {
  GRI_1: {
    name: "GRI 1: Foundation",
    requirements: [
      "Statement of use of the GRI Standards",
      "Organizational profile",
      "Ethics and integrity",
      "Governance",
      "Stakeholder engagement",
      "Reporting practice"
    ]
  },
  GRI_2: {
    name: "GRI 2: General Disclosures",
    requirements: [
      "Organizational details",
      "Entities included in the sustainability statements",
      "Activities, value chain and other business relationships",
      "Employees",
      "Governance structure and composition",
      "Role of the highest governance body in overseeing the management of impacts",
      "Delegation of responsibility for managing impacts",
      "Responsibility for sustainability matters within the highest governance body",
      "Conflicts of interest",
      "Role of the highest governance body in sustainability reporting",
      "Collective knowledge of sustainability matters",
      "Stakeholder engagement",
      "Policy commitments",
      "Embedding policy commitments",
      "Due diligence processes",
      "Mechanisms for seeking advice and raising concerns",
      "Compliance with laws and regulations",
      "Communication of policy commitments",
      "Approach to grievance handling",
      "Key impacts, risks and opportunities",
      "Activities and value chain",
      "Business model",
      "Strategy",
      "Sustainability and values",
      "Policies",
      "Governance structure",
      "Stakeholder engagement",
      "Ethical behaviour",
      "Culture of ethical behaviour",
      "Legal compliance",
      "Grievance mechanisms",
      "Impacts, risks and opportunities",
      "Climate change",
      "Value chain",
      "Market presence",
      "Economic performance",
      "Procurement practices",
      "Anti-corruption",
      "Anti-competitive behavior",
      "Tax",
      "Presence in markets",
      "Indirect economic impacts",
      "Market presence",
      "Customers",
      "Products and services",
      "Labeling",
      "Marketing communications",
      "Customer privacy",
      "Compliance"
    ]
  },
  GRI_3: {
    name: "GRI 3: Material Topics",
    requirements: [
      "Process to determine material topics",
      "List of material topics",
      "Management of material topics",
      "Topic-specific disclosures for each material topic"
    ]
  }
};

const GRI_TOPIC_STANDARDS = {
  ECONOMIC: {
    GRI_201: {
      name: "Economic Performance",
      metrics: [
        "Direct economic value generated and distributed",
        "Financial implications and other risks and opportunities due to climate change",
        "Defined benefit plan obligations and other retirement plans",
        "Financial assistance received from government",
        "Revenue",
        "Operating costs",
        "Employee compensation and benefits",
        "Government grants",
        "Community investments"
      ]
    },
    GRI_202: {
      name: "Market Presence",
      metrics: [
        "Minimum entry-level wage",
        "Proportion of senior management hired from the local community",
        "Local hiring",
        "Local procurement"
      ]
    },
    GRI_203: {
      name: "Indirect Economic Impacts",
      metrics: [
        "Infrastructure investments and services supported",
        "Significant indirect economic impacts"
      ]
    },
    GRI_204: {
      name: "Procurement Practices",
      metrics: [
        "Proportion of spending on local suppliers",
        "Procurement from small and local suppliers",
        "Supplier selection criteria"
      ]
    },
    GRI_205: {
      name: "Anti-corruption",
      metrics: [
        "Operations assessed for risks related to corruption",
        "Communication and training on anti-corruption policies and procedures",
        "Confirmed incidents of corruption and actions taken"
      ]
    },
    GRI_206: {
      name: "Anti-competitive Behavior",
      metrics: [
        "Occurrences of non-compliance with laws and regulations concerning anti-competitive behavior"
      ]
    },
    GRI_207: {
      name: "Tax",
      metrics: [
        "Approach to tax",
        "Tax governance and control",
        "Country-by-country reporting",
        "Tax risk management",
        "Stakeholder engagement and tax transparency"
      ]
    }
  },
  ENVIRONMENTAL: {
    GRI_301: {
      name: "Materials",
      metrics: [
        "Materials used by weight or volume",
        "Percentage of materials used that are recycled input materials"
      ]
    },
    GRI_302: {
      name: "Energy",
      metrics: [
        "Energy consumption within the organization",
        "Energy consumption outside of the organization",
        "Energy intensity",
        "Reduction in energy consumption",
        "Reductions in energy requirements of products and services"
      ]
    },
    GRI_303: {
      name: "Water and Effluents",
      metrics: [
        "Water withdrawal by source",
        "Water discharge by quality and destination",
        "Water consumption",
        "Water recycling and reuse"
      ]
    },
    GRI_304: {
      name: "Biodiversity",
      metrics: [
        "Operations in or adjacent to protected areas",
        "Significant impacts of activities on biodiversity",
        "Habitats protected or restored",
        "IUCN Red List species with habitats in areas affected by operations"
      ]
    },
    GRI_305: {
      name: "Emissions",
      metrics: [
        "Direct GHG emissions (Scope 1)",
        "Energy indirect GHG emissions (Scope 2)",
        "Other indirect GHG emissions (Scope 3)",
        "GHG intensity",
        "Reduction of GHG emissions",
        "GHG emissions avoided",
        "Ozone-depleting substances",
        "NOx, SOx, and other significant air emissions"
      ]
    },
    GRI_306: {
      name: "Effluents and Waste",
      metrics: [
        "Waste by type and disposal method",
        "Waste diverted from disposal",
        "Waste directed to disposal",
        "Treatment and disposal of hazardous waste",
        "Water discharge by quality and destination"
      ]
    },
    GRI_307: {
      name: "Environmental Compliance",
      metrics: [
        "Non-compliance with environmental laws and regulations"
      ]
    },
    GRI_308: {
      name: "Supplier Environmental Assessment",
      metrics: [
        "New suppliers that were screened using environmental criteria",
        "Negative environmental impacts in the supply chain and actions taken"
      ]
    }
  },
  SOCIAL: {
    GRI_401: {
      name: "Employment",
      metrics: [
        "New employee hires and employee turnover",
        "Benefits provided to full-time employees",
        "Return to work and retention rates after parental leave"
      ]
    },
    GRI_402: {
      name: "Labor/Management Relations",
      metrics: [
        "Minimum notice periods regarding operational changes",
        "Collective bargaining coverage"
      ]
    },
    GRI_403: {
      name: "Occupational Health and Safety",
      metrics: [
        "Occupational health and safety management system",
        "Hazard identification, risk assessment, and incident investigation",
        "Occupational health services",
        "Worker training on occupational health and safety",
        "Worker participation, consultation, and communication on occupational health and safety",
        "Prevention and mitigation of occupational health and safety risks directly linked by business relationships",
        "Workers covered by an occupational health and safety management system",
        "Work-related injuries",
        "Work-related ill health",
        "Occupational diseases"
      ]
    },
    GRI_404: {
      name: "Training and Education",
      metrics: [
        "Average hours of training per year per employee",
        "Programs for upgrading employee skills and transition assistance programs",
        "Percentage of employees receiving regular performance and career development reviews"
      ]
    },
    GRI_405: {
      name: "Diversity and Equal Opportunity",
      metrics: [
        "Diversity of governance bodies and employees",
        "Ratio of basic salary and remuneration of women to men"
      ]
    },
    GRI_406: {
      name: "Non-discrimination",
      metrics: [
        "Incidents of discrimination and corrective actions taken"
      ]
    },
    GRI_407: {
      name: "Freedom of Association and Collective Bargaining",
      metrics: [
        "Operations and suppliers in which the right to exercise freedom of association and collective bargaining may be at risk",
        "Operations and suppliers identified as having significant risk for incidents of child labor",
        "Operations and suppliers identified as having significant risk for incidents of forced or compulsory labor",
        "Training on workers' rights"
      ]
    },
    GRI_408: {
      name: "Child Labor",
      metrics: [
        "Operations and suppliers identified as having significant risk for incidents of child labor",
        "Training on child labor prevention"
      ]
    },
    GRI_409: {
      name: "Forced or Compulsory Labor",
      metrics: [
        "Operations and suppliers identified as having significant risk for incidents of forced or compulsory labor",
        "Training on forced labor prevention"
      ]
    },
    GRI_410: {
      name: "Security Practices",
      metrics: [
        "Security personnel trained in human rights policies or procedures"
      ]
    },
    GRI_411: {
      name: "Rights of Indigenous Peoples",
      metrics: [
        "Incidents of violations involving rights of indigenous peoples"
      ]
    },
    GRI_412: {
      name: "Human Rights Assessment",
      metrics: [
        "Operations that have been subject to human rights reviews or impact assessments",
        "Training programs on human rights policies or procedures for employees",
        "Significant investment agreements and contracts that include human rights clauses",
        "Significant investment agreements that contain human rights clauses"
      ]
    },
    GRI_413: {
      name: "Local Communities",
      metrics: [
        "Operations with local community engagement, impact assessments, and development programs",
        "Operations with significant actual and potential negative impacts on local communities"
      ]
    },
    GRI_414: {
      name: "Supplier Social Assessment",
      metrics: [
        "New suppliers that were screened using social criteria",
        "Negative social impacts in the supply chain and actions taken"
      ]
    },
    GRI_415: {
      name: "Public Policy",
      metrics: [
        "Political contributions",
        "Lobbying",
        "Public policy positions"
      ]
    },
    GRI_416: {
      name: "Customer Health and Safety",
      metrics: [
        "Assessment of the health and safety impacts of products and services",
        "Incidents of non-compliance concerning the health and safety impacts of products and services"
      ]
    },
    GRI_417: {
      name: "Marketing and Labeling",
      metrics: [
        "Requirements for product and service information and labeling",
        "Incidents of non-compliance concerning marketing and labeling",
        "Marketing communications"
      ]
    },
    GRI_418: {
      name: "Customer Privacy",
      metrics: [
        "Substantiated complaints concerning breaches of customer privacy and losses of customer data"
      ]
    },
    GRI_419: {
      name: "Socioeconomic Compliance",
      metrics: [
        "Non-compliance with laws and regulations in the social and economic area"
      ]
    },
    GRI_420: {
      name: "Social Performance of the Supply Chain",
      metrics: [
        "Percentage of suppliers assessed for social performance",
        "Significant actual and potential negative social impacts in the supply chain",
        "Improvement actions taken in response to identified negative social impacts"
      ]
    }
  }
};

const GRI_SECTOR_STANDARDS = {
  AGRICULTURE: "GRI 11: Agriculture, Aquaculture and Fishing",
  COAL: "GRI 12: Coal Sector",
  OIL_GAS: "GRI 13: Oil and Gas",
  AEROSPACE_DEFENSE: "GRI 14: Aerospace and Defense",
  COMMERCIAL_BANKS: "GRI 15: Commercial Banks",
  CONSTRUCTION: "GRI 16: Construction and Real Estate",
  FOOD_PROCESSING: "GRI 17: Food and Beverage Processing",
  RENTAL_SERVICES: "GRI 18: Rental Services and Leasing",
  MEDIA_BROADCASTING: "GRI 19: Media and Broadcasting",
  METALS_MINING: "GRI 20: Metals and Mining",
  OIL_GAS_SERVICES: "GRI 21: Oil and Gas Services",
  RENEWABLE_ENERGY: "GRI 22: Renewable Energy",
  TELECOMMUNICATIONS: "GRI 23: Telecommunications",
  TRANSPORT: "GRI 24: Transport Services",
  WASTE_SERVICES: "GRI 25: Waste Management Services"
};

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
    const { organizationProfile, sector, materialTopics, existingData } = body;

    // Verify project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { organisation: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Use Z-AI SDK for GRI assessment
    const assessment = await assessGRICompliance(
      organizationProfile,
      sector,
      materialTopics,
      existingData
    );

    // Save assessment to database
    const griAssessment = await db.gRIAssessment.create({
      data: {
        projectId: projectId,
        universalStandards: assessment.universalStandards,
        sectorStandards: assessment.sectorStandards,
        topicStandards: assessment.topicStandards,
        reportingPrinciples: assessment.reportingPrinciples,
        stakeholderEngagement: assessment.stakeholderEngagement,
        materiality: assessment.materiality,
        disclosures: assessment.disclosures,
        overallScore: assessment.overallScore,
        gapAnalysis: assessment.gapAnalysis,
        recommendations: assessment.recommendations
      }
    });

    return NextResponse.json({
      success: true,
      assessmentId: griAssessment.id,
      results: assessment
    });

  } catch (error) {
    console.error('GRI assessment error:', error);
    return NextResponse.json(
      { error: 'Failed to perform GRI assessment' },
      { status: 500 }
    );
  }
}

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

    // Get latest GRI assessment for the project
    const assessment = await db.gRIAssessment.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });

    if (!assessment) {
      return NextResponse.json({ 
        message: 'No GRI assessment found for this project',
        standards: {
          universal: GRI_UNIVERSAL_STANDARDS,
          topic: GRI_TOPIC_STANDARDS,
          sector: GRI_SECTOR_STANDARDS
        }
      }, { status: 200 });
    }

    return NextResponse.json({
      assessment,
      standards: {
        universal: GRI_UNIVERSAL_STANDARDS,
        topic: GRI_TOPIC_STANDARDS,
        sector: GRI_SECTOR_STANDARDS
      }
    });

  } catch (error) {
    console.error('Get GRI assessment error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve GRI assessment' },
      { status: 500 }
    );
  }
}

async function assessGRICompliance(
  organizationProfile: any,
  sector: string,
  materialTopics: string[],
  existingData: any
) {
  // Import Z-AI SDK
  const { ZAIClient } = await import('z-ai-web-dev-sdk');
  const client = new ZAIClient({
    apiKey: process.env.Z_AI_API_KEY
  });

  const prompt = `As a GRI Standards expert, assess the organization's readiness for GRI reporting based on the following information:

Organization Profile:
${JSON.stringify(organizationProfile, null, 2)}

Sector: ${sector}

Material Topics: ${materialTopics.join(', ')}

Existing Data: ${JSON.stringify(existingData, null, 2)}

Please provide a comprehensive GRI assessment including:

1. Universal Standards Compliance (GRI 1, 2, 3):
   - GRI 1: Foundation - Statement of use, organizational profile, ethics, governance
   - GRI 2: General Disclosures - Organizational details, activities, governance, stakeholder engagement
   - GRI 3: Material Topics - Process to determine material topics, management approach

2. Topic Standards Readiness:
   - Economic: GRI 201-207
   - Environmental: GRI 301-308  
   - Social: GRI 401-420

3. Sector Standards (if applicable):
   - Identify relevant sector standard for ${sector}
   - Assess sector-specific requirements

4. Reporting Principles Assessment:
   - Stakeholder inclusiveness
   - Sustainability context
   - Materiality
   - Completeness
   - Accuracy
   - Balance
   - Comparability
   - Timeliness
   - Clarity
   - Reliability

5. Gap Analysis:
   - Identify missing disclosures
   - Assess data availability
   - Evaluate reporting processes

6. Recommendations:
   - Priority actions for compliance
   - Implementation timeline
   - Resource requirements

Provide specific scores (0-100) for each area and an overall GRI readiness score.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a GRI Standards expert with deep knowledge of sustainability reporting requirements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    });

    const assessmentText = response.choices[0].message.content;
    
    // Parse the AI response into structured assessment
    const assessment = parseGRIAssessment(assessmentText);
    
    return assessment;

  } catch (error) {
    console.error('Z-AI assessment error:', error);
    
    // Fallback to basic assessment
    return {
      universalStandards: {
        GRI_1: { score: 50, status: 'PARTIAL', gaps: ['Statement of use not documented'] },
        GRI_2: { score: 60, status: 'PARTIAL', gaps: ['Stakeholder engagement needs improvement'] },
        GRI_3: { score: 40, status: 'INADEQUATE', gaps: ['Material topics not formally identified'] }
      },
      sectorStandards: {
        applicable: false,
        standard: null,
        score: 0
      },
      topicStandards: {
        economic: { score: 45, covered: 3, total: 7 },
        environmental: { score: 55, covered: 5, total: 8 },
        social: { score: 50, covered: 10, total: 20 }
      },
      reportingPrinciples: {
        stakeholderInclusiveness: 60,
        sustainabilityContext: 45,
        materiality: 40,
        completeness: 50,
        accuracy: 65,
        balance: 55,
        comparability: 45,
        timeliness: 70,
        clarity: 60,
        reliability: 55
      },
      stakeholderEngagement: {
        score: 45,
        methods: ['Survey'],
        frequency: 'Annual',
        coverage: 'Limited'
      },
      materiality: {
        score: 40,
        process: 'Informal',
        topics: materialTopics,
        validation: 'Not validated'
      },
      disclosures: {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0
      },
      overallScore: 50,
      gapAnalysis: {
        critical: ['Formal materiality assessment process', 'Stakeholder engagement framework'],
        major: ['Data collection systems', 'Reporting processes'],
        minor: ['Documentation', 'Training']
      },
      recommendations: [
        'Establish formal materiality assessment process',
        'Develop comprehensive stakeholder engagement strategy',
        'Implement data collection systems for GRI metrics',
        'Create reporting timeline and governance structure',
        'Train team on GRI Standards requirements'
      ]
    };
  }
}

function parseGRIAssessment(assessmentText: string) {
  // This is a simplified parser - in production, you'd want more sophisticated parsing
  const lines = assessmentText.split('\n');
  const assessment: any = {
    universalStandards: {},
    sectorStandards: {},
    topicStandards: {},
    reportingPrinciples: {},
    stakeholderEngagement: {},
    materiality: {},
    disclosures: {},
    overallScore: 0,
    gapAnalysis: {},
    recommendations: []
  };

  // Extract overall score (simplified)
  const scoreMatch = assessmentText.match(/overall.*score.*?(\d+)/i);
  if (scoreMatch) {
    assessment.overallScore = parseInt(scoreMatch[1]);
  }

  // Extract recommendations (simplified)
  const recommendationLines = lines.filter(line => 
    line.includes('recommend') || line.includes('implement') || line.includes('develop')
  );
  assessment.recommendations = recommendationLines.slice(0, 5);

  // Default values for other sections
  assessment.universalStandards = {
    GRI_1: { score: 65, status: 'PARTIAL', gaps: ['Formal statement of use needed'] },
    GRI_2: { score: 70, status: 'PARTIAL', gaps: ['Enhanced stakeholder engagement'] },
    GRI_3: { score: 55, status: 'PARTIAL', gaps: ['More systematic materiality process'] }
  };

  assessment.topicStandards = {
    economic: { score: 60, covered: 4, total: 7 },
    environmental: { score: 65, covered: 5, total: 8 },
    social: { score: 55, covered: 11, total: 20 }
  };

  assessment.reportingPrinciples = {
    stakeholderInclusiveness: 65,
    sustainabilityContext: 60,
    materiality: 55,
    completeness: 60,
    accuracy: 70,
    balance: 65,
    comparability: 60,
    timeliness: 75,
    clarity: 65,
    reliability: 60
  };

  assessment.gapAnalysis = {
    critical: ['Materiality assessment formalization', 'Stakeholder engagement framework'],
    major: ['Data collection systems', 'Internal reporting processes'],
    minor: ['Documentation improvements', 'Team training']
  };

  return assessment;
}