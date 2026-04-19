const { z } = require('zod');

const assignedToSchema = z.array(z.string()).default([]);
const updateTaskSchema = z.object({
    assignedTo: assignedToSchema,
    status: z.string().optional()
}).partial();

console.log("Empty object:", updateTaskSchema.parse({}));
console.log("Status only:", updateTaskSchema.parse({ status: 'done' }));

const assignedToSchemaNoDefault = z.array(z.string()).optional();
const updateTaskSchemaNoDefault = z.object({
    assignedTo: assignedToSchemaNoDefault,
    status: z.string().optional()
}).partial();

console.log("No default - Empty object:", updateTaskSchemaNoDefault.parse({}));
console.log("No default - Status only:", updateTaskSchemaNoDefault.parse({ status: 'done' }));
