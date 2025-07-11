import fs from 'fs';
import path from 'path';

import swaggerJSDoc from 'swagger-jsdoc';

import { schemas } from './swagger-schemas.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dota Data API',
      version: '1.0.0',
      description: 'API documentation for Dota Data service routes.',
    },
    servers: [{ url: '/api' }],
    components: {
      schemas,
    },
  },
  apis: ['./src/app/api/**/*.ts', './src/app/api/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

const outputPath = path.join(process.cwd(), 'public', 'openapi.json');

try {
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
  console.log(`Swagger documentation generated successfully at: ${outputPath}`);
} catch (error) {
  console.error('Error generating swagger documentation:', error);
  process.exit(1);
} 