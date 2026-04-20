import serverless from 'serverless-http';
import app from '../../api/index.ts';

// Netlify uses 'handler' as the export for its functions
export const handler = serverless(app);
