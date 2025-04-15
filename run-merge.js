import { processPlatformResults, configurePaths } from './scripts/mergeResults.js';

// Define os caminhos usados na pipeline
const OLD_PATH = './data/results';   // Dados antigos (mesmo diretório)
const NEW_PATH = './data/results';   // Dados novos (mesmo diretório)

async function runMerge() {
  try {
    console.log('Configurando caminhos específicos para o CI...');
    console.log(`OLD_PATH: ${OLD_PATH}`);
    console.log(`NEW_PATH: ${NEW_PATH}`);
    
    // Configura os caminhos explicitamente
    configurePaths(OLD_PATH, NEW_PATH);
    
    // Executa o merge para cada plataforma
    await processPlatformResults('olx');
    await processPlatformResults('zap');
    
    console.log('Merge completo!');
  } catch (error) {
    console.error('Erro durante o merge:', error);
    process.exit(1);
  }
}

runMerge();
