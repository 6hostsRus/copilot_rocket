#!/usr/bin/env node
import { execSync } from 'node:child_process';

try{
  execSync('node ./bin/generate-runtime.mjs',{stdio:'inherit'});
  console.log('Verify: generated successfully (no git diff check here).');
}catch(e){
  console.error('Verify failed',e.message);
  process.exit(1);
}
