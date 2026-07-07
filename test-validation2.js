const { z } = require('zod');

const salesDataSchema = z.object({
  firstYearAverage: z.number().min(0).default(0),
  monthlyGrid: z.array(z.number().min(0)).length(12).optional(),
  growthRateYear2: z.number().min(0).default(0),
  growthRateYear3: z.number().min(0).default(0),
}).optional();

const data = {
  firstYearAverage: 30000,
  monthlyGrid: [],
  growthRateYear2: 30,
  growthRateYear3: 20
};

console.log(salesDataSchema.safeParse(data));
