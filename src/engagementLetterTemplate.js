// src/engagementLetterTemplate.js
// ============================================================================
// Engagement Letter template — pure data file (D-29 pattern, like translations.js).
// Body text is rendered by App.jsx <EngagementLetter/> component with token
// substitution. Tokens supported:
//   {{date}}                — today (formatted by lang)
//   {{firmName}}            — settings.companyName (default fallback below)
//   {{firmPhone}}           — settings.companyPhone || settings.advisorPhone
//   {{firmEmail}}           — settings.advisorEmail
//   {{firmTagline}}         — fixed default below; can be made editable later
//   {{advisorName}}         — settings.advisorName
//   {{clientGreeting}}      — "Dear Jane[ & John]," computed by App.jsx
//   {{selectedServiceName}} — derived from selected service in intake
//   {{selectedServicePrice}}— derived from selected service in intake
//   {{ongoingFeeAmount}}    — settings.ongoingFeeAmount (annual)
//   {{ongoingFeeQuarterly}} — settings.ongoingFeeQuarterly
//   {{aumPct}}              — settings.aumPct (e.g., "1.00%")
//   {{aumFrequency}}        — settings.aumFrequency (e.g., "quarterly")
//
// To customize fee defaults, edit ELT_DEFAULTS below. To customize body text
// per-advisor (Phase 2), the advisor will override settings.engagementLetterTemplate.
// ============================================================================

export const ELT_DEFAULTS = {
  firmTagline: "Guiding you safely to financial freedom.",
  ongoingFeeAmount: "500",
  ongoingFeeMonthlyLite: "30",
  aumPct: "1.00%",
  aumFrequency: "quarterly"
};

// Each section is an object so the renderer can show/hide individually and
// substitute fee data inline. `kind: "section4"` is special-rendered to read
// the selected service price live.
export const ENGAGEMENT_LETTER = {
  en: {
    headerFirm: "Golden Anchor Financial Planning & Wealth Management",
    headerSub: "Financial Planning Engagement Letter",
    firmBlock: [
      "Firm: {{firmName}}",
      "Phone: {{firmPhone}} | Email: {{firmEmail}}",
      "Tagline: {{firmTagline}}"
    ],
    dateLabel: "Date: {{date}}",
    greeting: "{{clientGreeting}}",
    intro: "Thank you for the opportunity to work with you. We are excited to partner with you in building and maintaining a comprehensive financial plan that aligns with your values and life goals. This Engagement Letter explains the scope of our services, our mutual responsibilities, fees and compensation, conflicts of interest disclosures, and other important terms in accordance with the Financial Planning & Wealth Management Professional (FPWMP) Practice Standards.",
    introCarefully: "Please read this document carefully. If anything is unclear, let us know and we will gladly discuss it with you. When you are comfortable with everything contained herein, please sign where indicated to formalize our engagement.",
    sincerely: "Sincerely,",
    signatureLine: "{{advisorName}}",
    sections: [
      {
        n: "1",
        title: "Scope of the Engagement & Provision of Services",
        body: "You have engaged Golden Anchor to provide a holistic financial planning service. Our work may be delivered directly by our team or, when appropriate, through coordination with carefully selected and disclosed third-party professionals (e.g., attorneys, CPAs).",
        sub: [
          {
            t: "1.1 Initial Identified Goals (to be refined)",
            b: "Based on our preliminary conversations, your current, high-level goals appear to include:",
            list: [
              "Investment Planning: Ensure your portfolio(s) are appropriately allocated and tax-efficient to meet both intermediate and long-term objectives (e.g., major purchases, lifestyle improvements, wealth accumulation).",
              "Retirement Planning: Accumulate sufficient assets to retire on your desired timeline without compromising your lifestyle.",
              "Estate & Legacy Planning: Transfer assets to heirs and/or charities efficiently, minimizing taxes and administrative expenses, and ensuring your wishes are honored (including trust planning, if necessary).",
              "Risk Management & Insurance Planning: Protect against income loss, disability, premature death, and other catastrophic risks through suitable insurance strategies and emergency reserves."
            ],
            after: "These broad goals will be refined and prioritized during our discovery and planning process so we can create targeted, actionable recommendations."
          }
        ]
      },
      {
        n: "2",
        title: "Our Financial Planning Process (7 Steps Aligned with FPWMP Standards)",
        body: "Golden Anchor follows a structured, iterative framework consistent with FPWMP practice standards:",
        steps: [
          ["Understand Your Personal & Financial Circumstances", "We gather qualitative and quantitative data about your finances, values, risk tolerance, and constraints."],
          ["Identify, Select & Prioritize Goals", "We collaborate to clarify goals, define success metrics, and prioritize what matters most."],
          ["Analyze Your Current Course of Action; Develop Alternatives", "We evaluate current strategies, identify gaps, and model potential alternatives."],
          ["Develop Recommendations", "We craft actionable, evidence-based recommendations that align with your goals and constraints."],
          ["Present Recommendations", "We review our recommendations with you, explain assumptions, trade-offs, and reasoning, and revise as needed."],
          ["Implement Agreed-Upon Recommendations", "We help you execute the plan—selecting products, coordinating with professionals, and tracking task completion."],
          ["Monitor Your Progress & Update the Plan", "At least annually (or at other intervals agreed upon), we review results, update assumptions, and adjust the plan as your life and markets change."]
        ]
      },
      {
        n: "3",
        title: "Responsibilities",
        sub: [
          {
            t: "3.1 Golden Anchor's Responsibilities",
            b: "We will:",
            list: [
              "Maintain the confidentiality of all personal and financial information you provide, except as required by law or as authorized by you in writing.",
              "Prepare a comprehensive overview of your financial position: net worth, cash flow, insurance coverage, tax positioning, investment allocation, estate documents, etc.",
              "Facilitate goal setting, document those goals, and update them upon material changes.",
              "Analyze your current strategies and determine if they are expected to meet your goals.",
              "Prepare and deliver a written financial plan with specific recommendations and supporting analysis.",
              "Provide advice on the steps, products, and services needed to implement the plan.",
              "Coordinate with other professionals (attorneys, CPAs, trustees, Investment Managers) as needed.",
              "Assist with implementation, if requested, and monitor progress toward your goals on an ongoing basis.",
              "Disclose all material conflicts of interest and compensation arrangements."
            ]
          },
          {
            t: "3.2 Your Responsibilities",
            b: "You agree to:",
            list: [
              "Provide complete, accurate, and timely information necessary for the planning process.",
              "Notify us promptly of any material changes in your circumstances, goals, or risk tolerance.",
              "Review the plan and recommendations carefully and ask questions if anything is unclear.",
              "Implement (or instruct us to implement) recommendations you have approved.",
              "Meet with us at least annually, or as otherwise agreed, to review and update your plan."
            ]
          }
        ]
      },
      {
        n: "4",
        title: "Compensation & Fees",
        kind: "section4",
        body: "Our compensation structure is transparent and complies with FPWMP requirements:",
        section4: {
          planLabel: "Comprehensive Financial Plan Flat Fee",
          planNote: "Includes data gathering, analysis, written plan, and initial presentation meeting. Includes the first annual plan review.",
          ongoingLabel: "Ongoing Planning/Monitoring Fee (after Year 1)",
          ongoingValue: "${{ongoingFeeAmount}} annually (or ${{ongoingFeeMonthlyLite}} per month under the Lite plan, if applicable).",
          referralLabel: "Referral Fees",
          referralValue: "We do not receive referral fees for introducing you to third-party professionals. If this ever changes, we will disclose it in writing before making a referral."
        },
        after: "All fees and compensation will be fully disclosed prior to you incurring any cost."
      },
      {
        n: "5",
        title: "Conflicts of Interest",
        body: "We are committed to acting in your best interest. We will disclose all material conflicts of interest in writing prior to or at the time services are rendered. Examples include, but are not limited to:",
        list: [
          "Receiving compensation from third parties for products or services we recommend.",
          "Differential compensation between competing products.",
          "Relationships with affiliated entities that may benefit from our recommendations."
        ],
        after: "If a conflict arises that we cannot reasonably mitigate, we will inform you and discuss appropriate next steps, which may include declining to provide a particular service."
      },
      {
        n: "6",
        title: "Confidentiality & Data Protection",
        body: "All client information is held in strict confidence. We use industry-standard safeguards to protect your personal and financial data. We do not sell or rent your information. We may share information only with your written authorization or as required by law, regulation, or compulsory legal process."
      },
      {
        n: "7",
        title: "Term, Termination & Limitations",
        body: "This engagement begins on the date of signature and continues until terminated by either party with written notice. Either party may terminate this engagement at any time, with or without cause. Fees paid for work not yet performed will be refunded on a pro-rata basis. We are not your attorney, accountant, or tax preparer. Our recommendations are not a substitute for professional legal or tax advice. You should consult appropriate professionals for those matters."
      },
      {
        n: "8",
        title: "Acknowledgment & Signature",
        body: "By signing below, you acknowledge that you have read, understood, and agree to the terms of this Engagement Letter. You confirm that the information you have provided is true and complete to the best of your knowledge, and you authorize Golden Anchor to begin the engagement described herein."
      }
    ]
  },

  es: {
    headerFirm: "Golden Anchor Planificación Financiera y Gestión de Patrimonio",
    headerSub: "Carta de Compromiso de Planificación Financiera",
    firmBlock: [
      "Firma: {{firmName}}",
      "Teléfono: {{firmPhone}} | Correo: {{firmEmail}}",
      "Lema: {{firmTagline}}"
    ],
    dateLabel: "Fecha: {{date}}",
    greeting: "{{clientGreeting}}",
    intro: "Gracias por la oportunidad de trabajar con usted. Estamos entusiasmados de asociarnos para construir y mantener un plan financiero integral alineado con sus valores y metas. Esta Carta de Compromiso explica el alcance de nuestros servicios, las responsabilidades mutuas, honorarios y compensación, divulgación de conflictos de interés y otros términos importantes conforme a las normas profesionales FPWMP.",
    introCarefully: "Por favor lea este documento cuidadosamente. Si algo no está claro, háganoslo saber y con gusto lo discutiremos. Cuando esté conforme con todo lo aquí expuesto, firme donde se indica para formalizar nuestro compromiso.",
    sincerely: "Atentamente,",
    signatureLine: "{{advisorName}}",
    sections: [
      {
        n: "1",
        title: "Alcance del Compromiso y Prestación de Servicios",
        body: "Ha contratado a Golden Anchor para ofrecer un servicio integral de planificación financiera. Nuestro trabajo puede entregarse directamente por nuestro equipo o, cuando sea apropiado, mediante coordinación con profesionales externos cuidadosamente seleccionados y revelados (por ejemplo, abogados, contadores)."
      },
      {
        n: "2",
        title: "Nuestro Proceso de Planificación (7 Pasos FPWMP)",
        body: "Golden Anchor sigue un marco estructurado e iterativo conforme a las normas FPWMP.",
        steps: [
          ["Entender Sus Circunstancias Personales y Financieras", "Recopilamos datos cualitativos y cuantitativos sobre sus finanzas, valores, tolerancia al riesgo y restricciones."],
          ["Identificar, Seleccionar y Priorizar Metas", "Colaboramos para clarificar metas, definir métricas de éxito y priorizar lo más importante."],
          ["Analizar el Curso Actual; Desarrollar Alternativas", "Evaluamos estrategias actuales, identificamos brechas y modelamos alternativas."],
          ["Desarrollar Recomendaciones", "Elaboramos recomendaciones accionables y basadas en evidencia."],
          ["Presentar Recomendaciones", "Revisamos las recomendaciones con usted y las ajustamos según sea necesario."],
          ["Implementar Recomendaciones Acordadas", "Le ayudamos a ejecutar el plan."],
          ["Monitorear el Progreso y Actualizar el Plan", "Al menos anualmente, revisamos resultados y ajustamos el plan."]
        ]
      },
      {
        n: "3",
        title: "Responsabilidades",
        body: "Golden Anchor mantendrá la confidencialidad, preparará un panorama financiero integral, facilitará el establecimiento de metas, analizará estrategias actuales, entregará un plan escrito, y revelará todos los conflictos de interés materiales. Usted proporcionará información completa, precisa y oportuna, y revisará e implementará las recomendaciones aprobadas."
      },
      {
        n: "4",
        title: "Compensación y Honorarios",
        kind: "section4",
        body: "Nuestra estructura de compensación es transparente y cumple con los requisitos FPWMP:",
        section4: {
          planLabel: "Honorario Fijo del Plan Financiero Integral",
          planNote: "Incluye recopilación de datos, análisis, plan escrito y reunión de presentación inicial. Incluye la primera revisión anual.",
          ongoingLabel: "Honorario de Planificación Continua (después del Año 1)",
          ongoingValue: "${{ongoingFeeAmount}} anuales (o ${{ongoingFeeMonthlyLite}} mensuales bajo el plan Lite, si aplica).",
          referralLabel: "Honorarios de Referidos",
          referralValue: "No recibimos honorarios de referidos por presentarle a profesionales externos. Si esto cambia, lo informaremos por escrito antes de la referencia."
        },
        after: "Todos los honorarios serán revelados antes de que incurra en cualquier costo."
      },
      {
        n: "5",
        title: "Conflictos de Interés",
        body: "Estamos comprometidos a actuar en su mejor interés. Revelaremos todos los conflictos de interés materiales por escrito antes o al momento de prestar los servicios."
      },
      {
        n: "6",
        title: "Confidencialidad y Protección de Datos",
        body: "Toda la información del cliente se mantiene en estricta confidencialidad. Usamos salvaguardas estándar de la industria para proteger sus datos personales y financieros. No vendemos ni alquilamos su información."
      },
      {
        n: "7",
        title: "Plazo, Terminación y Limitaciones",
        body: "Este compromiso comienza en la fecha de la firma y continúa hasta que cualquiera de las partes lo dé por terminado con aviso por escrito. Los honorarios pagados por trabajo no realizado serán reembolsados de forma prorrateada. No somos su abogado, contador ni preparador de impuestos."
      },
      {
        n: "8",
        title: "Reconocimiento y Firma",
        body: "Al firmar a continuación, usted reconoce que ha leído, comprendido y aceptado los términos de esta Carta de Compromiso."
      }
    ]
  }
};

// Substitute {{tokens}} in a string with values from a context object.
export function fillTokens(str, ctx) {
  if (!str) return "";
  return String(str).replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const v = ctx[k];
    return v == null || v === "" ? "—" : String(v);
  });
}
