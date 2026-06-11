# Master Client Questionnaire — Golden Anchor Finance

> **Purpose (Master Directive §J.3):** one guided conversation that captures EVERY field a
> client record holds (`golden-anchor-logic` SKILL §6), in plain 6th-grade language, EN/ES
> side by side. Built for low-income families and older, low-tech clients: judgment-free
> wording, memory prompts, no jargon. **MUST** = needed to build the report. **NICE** = adds
> value, skip if time is short. Advisor reads the questions aloud or hands this over; answers
> go straight into the app (entry order in `docs/ADVISOR-SOP.md` §4).
>
> **Tone rules:** never ask "why" about a debt. Never react to a number. Cash income is
> income — ask about it the same way as a paycheck. If the client looks tired, stop and use
> the 15-minute version (§10); the rest can wait for a second visit.

---

## 1. Household & Contact

| # | English | Español | App field | Need |
|---|---|---|---|---|
| 1.1 | What's your full name? | ¿Cuál es su nombre completo? | `firstName`, `lastName` | MUST |
| 1.2 | Do you handle money together with a spouse or partner? What's their name? | ¿Maneja el dinero junto con su esposo(a) o pareja? ¿Cómo se llama? | `partnerFirst`, `partnerLast` (blank = single) | MUST |
| 1.3 | What's the best phone number to reach you? | ¿Cuál es el mejor número de teléfono para contactarle? | `phone` / `p1Phone` | MUST |
| 1.4 | Do you use email? Which one do you check? | ¿Usa correo electrónico? ¿Cuál revisa? | `email` / `p1Email` | MUST |
| 1.5 | What's your home address? | ¿Cuál es la dirección de su casa? | `address` | NICE |
| 1.6 | What's your date of birth? (And your partner's?) | ¿Cuál es su fecha de nacimiento? (¿Y la de su pareja?) | `dob`, `p1Dob`, `p2Dob` | MUST |
| 1.7 | *(Only if applying for insurance)* I'll need your Social Security or ITIN number for the application — it stays private. | *(Solo si aplica a un seguro)* Necesitaré su número de Seguro Social o ITIN para la solicitud — se queda privado. | `social`, `p1Social`, `p2Social` | NICE |
| 1.8 | How did you hear about us? | ¿Cómo supo de nosotros? | `recommendedBy` (intake: `howHeard`) | NICE |
| 1.9 | Do you want help with money only, or money plus health insurance? | ¿Quiere ayuda solo con el dinero, o con el dinero y el seguro de salud? | `clientType` (financeOnly / financeAndHealth) | MUST |
| 1.10 | Do you prefer we talk in English or Spanish? | ¿Prefiere que hablemos en inglés o en español? | app language setting | MUST |

> SSN/ITIN note: **never required for coaching** — only collect when an insurance
> application needs it. It never appears in any shared portal (logic SKILL §2).

## 2. Income — every way money comes in (judgment-free)

> Say first: *"Everything counts the same here — a paycheck, cash jobs, babysitting,
> selling food, government help. I just need the real picture so the plan works."* /
> *"Aquí todo cuenta igual — un cheque, trabajos en efectivo, cuidar niños, vender comida,
> ayuda del gobierno. Solo necesito el panorama real para que el plan funcione."*

Each stream becomes `incomeStreams[] {person, label, gross, net, freq}`. `freq` ∈ weekly /
biweekly / semimonthly / monthly / annual.

| # | English | Español | App field | Need |
|---|---|---|---|---|
| 2.1 | Where do you work, and how often do you get paid — every week, every two weeks, twice a month, or monthly? | ¿Dónde trabaja y cada cuánto le pagan — cada semana, cada dos semanas, dos veces al mes, o mensual? | `label`, `freq` | MUST |
| 2.2 | How much is the check BEFORE they take taxes out? And how much actually lands in your hand or account? | ¿De cuánto es el cheque ANTES de los impuestos? ¿Y cuánto le llega de verdad a la mano o a la cuenta? | `gross`, `net` | MUST |
| 2.3 | Does your partner work? Same questions for them. | ¿Su pareja trabaja? Las mismas preguntas para él/ella. | `person:"p2"` stream | MUST |
| 2.4 | Any other money coming in? Think: cash jobs, side work, babysitting, rides, selling things, rent from a room, child support, Social Security, disability, retirement checks, help from family. | ¿Entra otro dinero? Piense: trabajos en efectivo, trabajitos extra, cuidar niños, viajes, vender cosas, renta de un cuarto, manutención de niños, Seguro Social, incapacidad, pensión, ayuda de familia. | extra `incomeStreams[]` rows | MUST |
| 2.5 | Does that amount change month to month? What's a LOW month look like? | ¿Esa cantidad cambia de mes a mes? ¿Cómo se ve un mes BAJO? | use the low number as `net` | NICE |

## 3. Monthly Bills — with memory prompts

> Each bill: `bills[] {name, cost, freq, dueDay, assignedTo, type, split}`. Type: regular /
> temporary (has an end date → `maturity`) / annual (one month a year → `dueMonth`).
> Walk the prompts slowly — most people forget 2–3 bills without them.

| # | English | Español | App field | Need |
|---|---|---|---|---|
| 3.1 | Let's list everything you pay every month. Think about: rent or mortgage… light bill… water… phone bill… internet… car payment… car insurance… gas for the car… groceries… | Vamos a anotar todo lo que paga cada mes. Piense en: renta o hipoteca… la luz… el agua… el teléfono… el internet… el pago del carro… el seguro del carro… la gasolina… el mercado/la comida… | `bills[]` name + cost + freq | MUST |
| 3.2 | …and the easy-to-forget ones: TV or streaming (Netflix, cable), kids' school stuff, babysitter or daycare, sending money to family, church giving, medicines, hair/nails, subscriptions on your phone. | …y las que se olvidan: TV o streaming (Netflix, cable), cosas de la escuela, niñera o guardería, envíos de dinero a la familia, diezmo/iglesia, medicinas, pelo/uñas, suscripciones en el teléfono. | more `bills[]` rows | MUST |
| 3.3 | What day of the month is each one due? (Look at your phone or the paper bill if you're not sure.) | ¿Qué día del mes se vence cada una? (Mire su teléfono o el papel si no está seguro.) | `dueDay` | NICE |
| 3.4 | Any bill that ENDS soon — like a furniture plan or a payment plan that finishes this year? | ¿Alguna cuenta que se TERMINA pronto — como un plan de muebles o un plan de pagos que acaba este año? | `type:"temporary"` + `maturity` | NICE |
| 3.5 | Anything you pay just once a year — car registration, school fees, insurance paid yearly? Which month? | ¿Algo que paga solo una vez al año — placa del carro, matrícula, un seguro anual? ¿En qué mes? | `type:"annual"` + `dueMonth` | NICE |
| 3.6 | Who pays each bill — you, your partner, or both together? | ¿Quién paga cada cuenta — usted, su pareja, o los dos juntos? | `assignedTo`, `split` | NICE |

## 4. Debts — cards and loans (no judgment, ever)

> Say first: *"Debt is just a number we're going to shrink — nothing to be embarrassed
> about."* / *"La deuda es solo un número que vamos a bajar — no hay nada de qué
> apenarse."* Cards → `cards[]`; loans → `loans[]`.

| # | English | Español | App field | Need |
|---|---|---|---|---|
| 4.1 | Which credit cards or store cards do you have? (Walmart, Macy's, gas-station cards count too.) | ¿Qué tarjetas de crédito o de tiendas tiene? (Walmart, Macy's, tarjetas de gasolinera también cuentan.) | `cards[].name` | MUST |
| 4.2 | For each card: what do you owe right now, and what's the credit limit? | Por cada tarjeta: ¿cuánto debe ahora, y cuál es el límite? | `balance`, `limit` | MUST |
| 4.3 | What's the interest rate (APR)? It's on the statement — if you don't know, bring the statement and we'll find it together. | ¿Cuál es el interés (APR)? Está en el estado de cuenta — si no lo sabe, traiga el papel y lo buscamos juntos. | `apr` | MUST |
| 4.4 | What's the minimum payment they ask for, and what day is it due? | ¿Cuál es el pago mínimo que piden, y qué día se vence? | `min`, `dueDay` | NICE |
| 4.5 | Any card with a special 0% promotion? When does the promo END? (This date matters a lot.) | ¿Alguna tarjeta con promoción de 0%? ¿Cuándo se TERMINA la promoción? (Esa fecha importa mucho.) | `promos[] {balance, rate, end}` | MUST |
| 4.6 | Any loans? Think: car loan, student loan, personal loan, mortgage, money borrowed from a person or app. How much is left, and the interest rate? | ¿Algún préstamo? Piense: del carro, estudiantil, personal, hipoteca, dinero prestado de una persona o una app. ¿Cuánto falta por pagar, y el interés? | `loans[] {name, type, balance, apr}` | MUST |
| 4.7 | Whose name is each card or loan under — yours, your partner's, or both? | ¿A nombre de quién está cada tarjeta o préstamo — suyo, de su pareja, o de los dos? | `owedBy` / `owner` | NICE |

## 5. Savings & Accounts

> `accounts[] {name, type, value, owner}` — checking/savings/money-market count as
> emergency money; retirement/IRA/brokerage do not (logic SKILL §3).

| # | English | Español | App field | Need |
|---|---|---|---|---|
| 5.1 | Where do you keep your money? Bank account, credit union, a cash app (Cash App, Zelle balance), or cash at home? About how much is in each? | ¿Dónde guarda su dinero? ¿Banco, cooperativa (credit union), una app (Cash App, saldo de Zelle), o efectivo en casa? ¿Más o menos cuánto hay en cada uno? | `accounts[]` checking/savings | MUST |
| 5.2 | Any savings set aside — even a small amount, even in an envelope? It all counts. | ¿Algún ahorro guardado — aunque sea poquito, aunque sea en un sobre? Todo cuenta. | `accounts[]` savings | MUST |
| 5.3 | Any retirement account — a 401(k) from work, an IRA, a pension? Roughly how much is in it? | ¿Alguna cuenta de retiro — un 401(k) del trabajo, una IRA, una pensión? ¿Más o menos cuánto tiene? | `accounts[]` retirement/ira | MUST |
| 5.4 | Do you own any investments — stocks, crypto, mutual funds? | ¿Tiene inversiones — acciones, cripto, fondos? | `marketInvestments[] {ticker, name, value}` | NICE |
| 5.5 | Do you own your home, a car, land, a small business, or anything else valuable? What would it sell for, and do you still owe money on it? | ¿Es dueño de su casa, un carro, un terreno, un negocito, o algo más de valor? ¿En cuánto se vendería, y todavía debe dinero por eso? | `customAssets[]/properties[] {name, value, cat, currentDebt, debtApr}` | MUST |
| 5.6 | If you lost your income tomorrow, how many months could you pay the bills? How many months of cushion would help you sleep at night? | Si perdiera su ingreso mañana, ¿cuántos meses podría pagar las cuentas? ¿Cuántos meses de colchón le dejarían dormir tranquilo? | `efMonths` (default 3) | NICE |

## 6. Insurance — health, life, car

> Maps to `clientType:"financeAndHealth"` + the onboarding insurance-interest checkboxes
> (Master Directive §D.2 — these are the lead flags). **Always offer the free consult.**

| # | English | Español | App field | Need |
|---|---|---|---|---|
| 6.1 | Do you and your family have health insurance right now? Through work, Medicaid, Medicare, or the Marketplace (Obamacare)? | ¿Usted y su familia tienen seguro de salud ahora? ¿Del trabajo, Medicaid, Medicare, o el Mercado (Obamacare)? | `clientType` + lead flag | MUST |
| 6.2 | The health-insurance review is FREE — no cost, no obligation. Want me to check if you can get a better or cheaper plan? | La revisión del seguro de salud es GRATIS — sin costo ni compromiso. ¿Quiere que revise si puede tener un plan mejor o más barato? | health-consult lead flag | MUST |
| 6.3 | Do you have life insurance? If something happened to you, would your family be okay with money? | ¿Tiene seguro de vida? Si algo le pasara, ¿su familia estaría bien económicamente? | notes.general + lead flag | NICE |
| 6.4 | When did you last compare car-insurance prices? If it's been over a year, I can connect you with someone I trust. | ¿Cuándo fue la última vez que comparó precios del seguro del carro? Si fue hace más de un año, le puedo conectar con alguien de confianza. | car-insurance checkbox + referral (SOP §7) | NICE |

## 7. Goals — short, mid, long

> `notes.shortTerm / midTerm / longTerm / goals` — these appear in the report and the
> client portal. `notes.setbacks` / `notes.general` are advisor-private (logic SKILL §2).

| # | English | Español | App field | Need |
|---|---|---|---|---|
| 7.1 | In the next YEAR, what would make you feel like this worked? (Catch up on bills, save $500, pay off a card…) | En el próximo AÑO, ¿qué le haría sentir que esto funcionó? (Ponerse al día, ahorrar $500, pagar una tarjeta…) | `notes.shortTerm` | MUST |
| 7.2 | In 1 to 5 years — a house? A better car? Money for the kids' school? No more debt? | En 1 a 5 años — ¿una casa? ¿un carro mejor? ¿dinero para la escuela de los niños? ¿cero deudas? | `notes.midTerm` | MUST |
| 7.3 | Way down the road — how do you picture life at retirement age? | A largo plazo — ¿cómo se imagina la vida a la edad de retiro? | `notes.longTerm` | NICE |
| 7.4 | What's the #1 money worry that keeps you up at night? | ¿Cuál es la preocupación #1 de dinero que no le deja dormir? | `notes.goals` | MUST |
| 7.5 | *(Advisor listens, doesn't ask directly)* Past setbacks worth remembering — job loss, illness, scams, eviction. | *(El asesor escucha, no pregunta directo)* Tropiezos del pasado — pérdida de trabajo, enfermedad, estafas, desalojo. | `notes.setbacks` (private) | NICE |

## 8. Documents to Bring / Documentos para Traer

Give this list at booking. *"Don't worry if you can't find everything — bring what you have."* /
*"No se preocupe si no encuentra todo — traiga lo que tenga."*

| Bring / Traiga | Why / Para qué |
|---|---|
| Last 2 paystubs (each worker) / Últimos 2 talones de pago (cada trabajador) | Income — gross, net, frequency (§2) |
| Most recent bank statement(s) / Estado(s) de cuenta del banco más reciente(s) | Accounts + catches forgotten bills (§3, §5) |
| One statement per credit card / Un estado de cuenta por tarjeta | Balance, APR, minimum, promo end dates (§4) |
| Loan papers or app screenshots / Papeles de préstamos o capturas de la app | Loan balances + rates (§4.6) |
| Insurance cards (health/car/life) / Tarjetas de seguro (salud/carro/vida) | Insurance review (§6) |
| Benefit award letters (SS, SSI, SNAP) / Cartas de beneficios | Income streams (§2.4) |
| Phone with their banking app, if they use one / Teléfono con su app del banco | Look up balances together on the spot |

## 9. Closing Script / Cierre

EN: *"That's everything. I'll put this into your plan and next time you'll see your whole
money picture in clear charts — what comes in, what goes out, and the fastest way out of
debt. Nothing you told me leaves this office."*
ES: *"Eso es todo. Voy a poner esto en su plan y la próxima vez verá todo su panorama de
dinero en gráficas claras — lo que entra, lo que sale, y la salida más rápida de las
deudas. Nada de lo que me contó sale de esta oficina."*

## 10. The 15-Minute Quick Version (first discovery call)

Just these, in order — enough for the first dashboard and a hook for the full meeting:

1. **1.1, 1.2, 1.3, 1.9, 1.10** — name, partner, phone, scope, language
2. **2.2 + 2.4 (totals only)** — "About how much lands in your hands each month, all together?" / "¿Más o menos cuánto le llega a las manos al mes, todo junto?" → one `incomeStreams` row
3. **3.1 (top 5 bills only)** — rent, light, phone, car, food → 5 `bills[]` rows
4. **4.2 + 4.6 (totals only)** — "All cards together, about how much do you owe? And loans?" / "Todas las tarjetas juntas, ¿como cuánto debe? ¿Y préstamos?" → one `cards[]` + one `loans[]` row, estimate APR 24% cards / ask loans
5. **5.2** — total savings, one `accounts[]` row
6. **7.1 + 7.4** — one-year goal + #1 worry
7. **6.2** — offer the free health-insurance consult
8. Book the full meeting + hand over the §8 documents list.
