import { processPlatformResults, configurePaths } from './scripts/alaSQLmergeResults.js';

const OLD_PATH = './data/results';
const NEW_PATH = '../data/results_new';

async function runMerge() {
  try {
    console.log('🔄 Configurando caminhos específicos para o CI...');
    console.log(`OLD_PATH: ${OLD_PATH}`);
    console.log(`NEW_PATH: ${NEW_PATH}`);
    
    configurePaths(OLD_PATH, NEW_PATH);
    
    console.log('🔄 Iniciando processamento de OLX...');
    await processPlatformResults('olx');
    
    console.log('🔄 Iniciando processamento de ZAP...');
    await processPlatformResults('zap');
    
    console.log('✅ Merge completo!');
  } catch (error) {
    console.error('❌ Erro durante o merge:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

runMerge();
