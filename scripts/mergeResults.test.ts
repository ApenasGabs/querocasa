import { PathLike } from "fs";
import fs from "fs/promises";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  MockInstance,
  test,
  vi,
} from "vitest";

// Caminhos de teste
const TEST_OLD_PATH = "/test-data/old";
const TEST_NEW_PATH = "/test-data/new";

describe("Teste do Merge de Resultados", () => {
  let writeFileSpy: MockInstance;
  function isStringContaining(
    path: PathLike | fs.FileHandle,
    substring: string
  ): boolean {
    return typeof path === "string" && path.includes(substring);
  }

  beforeEach(async () => {
    // Mock da função getBrasiliaTime
    vi.mock("./getBrasiliaTime.js", () => ({
      default: () => "2025-04-15T00:00:00.000Z",
    }));

    // Limpa todos os mocks anteriores
    vi.clearAllMocks();
    // Mock para fs.existsSync
    vi.spyOn(require("fs"), "existsSync").mockImplementation(() => true);

    // Mock para fs.promises.mkdir
    vi.spyOn(fs, "mkdir").mockResolvedValue(undefined);

    // Mock para fs.promises.writeFile
    writeFileSpy = vi
      .spyOn(fs, "writeFile")
      .mockImplementation(async (filePath, content) => {
        console.log(`Mock writeFile chamado com: ${filePath}`);
        console.log(`Conteúdo escrito: ${content}`);
        return Promise.resolve();
      });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("Caso 1: Item em ambos arquivos (deve manter todos dados antigos, atualizando apenas lastSeenAt e campos novos)", async () => {
    // Mock dos dados
    const oldData = [
      {
        id: "prop_123_original",
        link: "http://olx.com/1",
        price: "250000",
        firstSeenAt: "2023-01-01",
        description: "Descrição original",
        imagens: ["img1.jpg"],
        scrapedAt: "2023-01-01T12:00:00.000Z",
      },
    ];

    const newData = [
      {
        id: "prop_456_novo", // ID diferente que NÃO deve substituir o original
        link: "http://olx.com/1",
        price: "300000", // Preço atualizado
        description: "Nova descrição", // Campo atualizado
        scrapedAt: "2025-04-14T04:49:42.883Z", // Nova data de scraping que NÃO deve substituir a original
      },
    ];

    // Mock para fs.readFile com os dados específicos
    vi.spyOn(fs, "readFile").mockImplementation(async (filePath) => {
      if (isStringContaining(filePath, TEST_OLD_PATH)) {
        return JSON.stringify(oldData);
      } else if (isStringContaining(filePath, TEST_NEW_PATH)) {
        return JSON.stringify(newData);
      }
      return "[]";
    });

    // Importa o módulo com os mocks já aplicados
    const { processPlatformResults, configurePaths } = await import(
      "./mergeResults.js"
    );

    // Configura os caminhos
    configurePaths(TEST_OLD_PATH, TEST_NEW_PATH);

    // Executa a função
    await processPlatformResults("olx");

    // Procura a chamada relevante
    const relevantCall = writeFileSpy.mock.calls.find(
      (call) =>
        call[0].includes(TEST_OLD_PATH) && call[0].includes("olxResults.json")
    );

    expect(relevantCall).toBeDefined();

    if (!relevantCall) {
      throw new Error("writeFile was not called with the expected parameters");
    }
    const writtenData = JSON.parse(relevantCall[1]);

    // Verifica se o ID original foi mantido
    expect(writtenData[0].id).toBe("prop_123_original");

    // Verifica se o scrapedAt original foi mantido
    expect(writtenData[0].scrapedAt).toBe("2023-01-01T12:00:00.000Z"); // Data de scraping original (não atualizada)

    // Os outros campos são verificados normalmente
    expect(writtenData[0].firstSeenAt).toBe("2023-01-01"); // Data original mantida
    expect(writtenData[0].lastSeenAt).toBe("2025-04-15T00:00:00.000Z"); // Data atualizada
    expect(writtenData[0].price).toBe("300000"); // Preço atualizado
    expect(writtenData[0].description).toBe("Nova descrição"); // Descrição atualizada
    expect(writtenData[0].imagens).toEqual(["img1.jpg"]); // Campo não afetado mantido
  });

  test("Caso 2: Item existe em OLD_RESULTS_PATH mas não em NEW_RESULTS_PATH (deve ser removido)", async () => {
    // Mock dos dados
    const oldData = [
      {
        id: "prop_123",
        link: "http://olx.com/1",
        price: "250000",
        firstSeenAt: "2023-01-01",
      },
      {
        id: "prop_456",
        link: "http://olx.com/2", // Este link não existe nos dados novos
        price: "350000",
        firstSeenAt: "2023-02-01",
      },
      {
        id: "prop_789", // Este não tem link (não deve ser removido)
        price: "450000",
        firstSeenAt: "2023-03-01",
      },
    ];

    const newData = [
      {
        link: "http://olx.com/1", // Apenas este link existe nos novos dados
        price: "300000",
      },
    ];

    // Mock para fs.readFile com os dados específicos
    vi.spyOn(fs, "readFile").mockImplementation(async (filePath) => {
      if (isStringContaining(filePath, TEST_OLD_PATH)) {
        return JSON.stringify(oldData);
      } else if (isStringContaining(filePath, TEST_NEW_PATH)) {
        return JSON.stringify(newData);
      }
      return "[]";
    });
    // Type guard to check if a path is a string and contains a substring

    // Mock for fs.readFile with the data specific to this test
    vi.spyOn(fs, "readFile").mockImplementation(async (filePath) => {
      if (isStringContaining(filePath, TEST_OLD_PATH)) {
        return JSON.stringify(oldData);
      } else if (isStringContaining(filePath, TEST_NEW_PATH)) {
        return JSON.stringify(newData);
      }
      return "[]";
    });
    // Importa o módulo com os mocks já aplicados
    const { processPlatformResults, configurePaths } = await import(
      "./mergeResults.js"
    );

    // Configura os caminhos
    configurePaths(TEST_OLD_PATH, TEST_NEW_PATH);

    // Executa a função
    await processPlatformResults("olx");

    // Procura a chamada relevante
    const relevantCall = writeFileSpy.mock.calls.find(
      (call) =>
        call[0].includes(TEST_OLD_PATH) && call[0].includes("olxResults.json")
    );

    // Verifica se a chamada relevante foi encontrada
    expect(relevantCall).toBeDefined();

    // Verifica se os dados foram processados corretamente
    if (!relevantCall) {
      throw new Error("writeFile was not called with the expected parameters");
    }
    const writtenData = JSON.parse(relevantCall[1]);

    // Verifica se o resultado tem apenas o item atualizado e o item sem link
    expect(writtenData.length).toBe(1);

    // O item com prop_456 não deve existir no resultado
    expect(writtenData.find((item) => item.id === "prop_456")).toBeUndefined();

    // O item com prop_123 deve existir no resultado
    expect(writtenData.find((item) => item.id === "prop_123")).toBeDefined();

    // Verificar se os dados foram atualizados corretamente
    const updatedItem = writtenData.find((item) => item.id === "prop_123");
    expect(updatedItem.price).toBe("300000");
    expect(updatedItem.lastSeenAt).toBe("2025-04-15T00:00:00.000Z");
  });

  test("Caso 3: Item existe em NEW_RESULTS_PATH mas não em OLD_RESULTS_PATH (deve ser incluído)", async () => {
    // Mock dos dados
    const oldData = [
      {
        id: "prop_123",
        link: "http://olx.com/1",
        price: "250000",
        firstSeenAt: "2023-01-01",
      },
    ];

    const newData = [
      {
        link: "http://olx.com/1", // Já existe
        price: "300000",
      },
      {
        link: "http://olx.com/2", // Novo item
        price: "350000",
        description: "Novo imóvel",
      },
    ];

    // Mock para generateId para ter um valor previsível
    vi.mock(
      "./mergeResults.js",
      async (importOriginal) => {
        const originalModule: object = await importOriginal();
        return {
          ...originalModule,
          generateId: () => "prop_new_test_id",
        };
      }
      // { partial: true }
    );

    // Mock para fs.readFile com os dados específicos
    vi.spyOn(fs, "readFile").mockImplementation(async (filePath) => {
      if (isStringContaining(filePath, TEST_OLD_PATH)) {
        return JSON.stringify(oldData);
      } else if (isStringContaining(filePath, TEST_NEW_PATH)) {
        return JSON.stringify(newData);
      }
      return "[]";
    });

    // Importa o módulo com os mocks já aplicados
    const { processPlatformResults, configurePaths } = await import(
      "./mergeResults.js"
    );

    // Configura os caminhos
    configurePaths(TEST_OLD_PATH, TEST_NEW_PATH);

    // Executa a função
    await processPlatformResults("olx");

    // Procura a chamada relevante
    const relevantCall = writeFileSpy.mock.calls.find(
      (call) =>
        call[0].includes(TEST_OLD_PATH) && call[0].includes("olxResults.json")
    );

    // Verifica se a chamada relevante foi encontrada
    expect(relevantCall).toBeDefined();
    if (!relevantCall) {
      throw new Error("writeFile was not called with the expected parameters");
    }
    // Verifica se os dados foram processados corretamente
    const writtenData = JSON.parse(relevantCall[1]);

    // Verifica se todos os itens estão presentes
    expect(writtenData.length).toBe(2);

    // Verifica se o item novo foi adicionado corretamente
    const newItem = writtenData.find(
      (item) => item.link === "http://olx.com/2"
    );
    expect(newItem).toBeDefined();
    expect(newItem.price).toBe("350000");
    expect(newItem.firstSeenAt).toBe("2025-04-15T00:00:00.000Z");
    expect(newItem.lastSeenAt).toBe("2025-04-15T00:00:00.000Z");
    expect(newItem.description).toBe("Novo imóvel");

    // Verifica se o item existente foi atualizado
    const existingItem = writtenData.find(
      (item) => item.link === "http://olx.com/1"
    );
    expect(existingItem).toBeDefined();
    expect(existingItem.price).toBe("300000");
    expect(existingItem.firstSeenAt).toBe("2023-01-01"); // Mantido
    expect(existingItem.lastSeenAt).toBe("2025-04-15T00:00:00.000Z"); // Atualizado
  });

  test("Caso 4: Preservação de ID e scrapedAt ao atualizar itens existentes", async () => {
    // Mock dos dados - usando o exemplo real reportado
    const oldData = [
      {
        id: "prop_1744520733345_869",
        address: "Campinas, Residencial Colina das Nascentes",
        description: [
          { numberOfRooms: "3" },
          { floorSize: "75" },
          { numberOfParkingSpaces: "2" },
          { numberOfBathroomsTotal: "2" },
        ],
        images: ["https://img.olx.com.br/thumbs500x360/51/514557868594565.jpg"],
        link: "https://sp.olx.com.br/grande-campinas/imoveis/oportunidade-de-um-linda-casa-nova-60-000-abaixo-do-valor-1389125359",
        price: "320000",
        scrapedAt: "2025-04-13T05:05:33.345Z",
        publishDate: "2025-04-04 22:23:00",
        coords: { lat: -22.911, lon: -47.09605 },
      },
    ];

    const newData = [
      {
        id: "prop_1744606182883_2", // ID diferente que não deve ser usado
        address: "Campinas, Residencial Colina das Nascentes",
        description: [
          { numberOfRooms: "3" },
          { floorSize: "75" },
          { numberOfParkingSpaces: "2" },
          { numberOfBathroomsTotal: "2" },
        ],
        images: ["https://img.olx.com.br/thumbs500x360/51/514557868594565.jpg"],
        link: "https://sp.olx.com.br/grande-campinas/imoveis/oportunidade-de-um-linda-casa-nova-60-000-abaixo-do-valor-1389125359",
        price: "320000",
        scrapedAt: "2025-04-14T04:49:42.883Z", // Nova data que não deve substituir a original
        publishDate: "2025-04-04 22:23:00",
        coords: { lat: -22.911, lon: -47.09605 },
      },
    ];

    // Mock para fs.readFile com os dados específicos
    vi.spyOn(fs, "readFile").mockImplementation(async (filePath) => {
      if (isStringContaining(filePath, TEST_OLD_PATH)) {
        return JSON.stringify(oldData);
      } else if (isStringContaining(filePath, TEST_NEW_PATH)) {
        return JSON.stringify(newData);
      }
      return "[]";
    });

    // Importa o módulo com os mocks já aplicados
    const { processPlatformResults, configurePaths } = await import(
      "./mergeResults.js"
    );

    // Configura os caminhos
    configurePaths(TEST_OLD_PATH, TEST_NEW_PATH);

    // Executa a função
    await processPlatformResults("olx");

    // Procura a chamada relevante
    const relevantCall = writeFileSpy.mock.calls.find(
      (call) =>
        call[0].includes(TEST_OLD_PATH) && call[0].includes("olxResults.json")
    );

    // Verifica se a chamada relevante foi encontrada
    expect(relevantCall).toBeDefined();
    if (!relevantCall) {
      throw new Error("writeFile was not called with the expected parameters");
    }
    // Verifica se os dados foram atualizados corretamente
    const writtenData = JSON.parse(relevantCall[1]);

    // Verificações específicas para o caso reportado
    expect(writtenData.length).toBe(1);

    const updatedItem = writtenData[0];

    // O ID original deve ser preservado
    expect(updatedItem.id).toBe("prop_1744520733345_869");

    // A data de scraping original deve ser preservada
    expect(updatedItem.scrapedAt).toBe("2025-04-13T05:05:33.345Z");

    // A data de última visualização deve ser atualizada
    expect(updatedItem.lastSeenAt).toBe("2025-04-15T00:00:00.000Z");

    // Outros campos devem ser mantidos
    expect(updatedItem.price).toBe("320000");
    expect(updatedItem.address).toBe(
      "Campinas, Residencial Colina das Nascentes"
    );
    expect(updatedItem.link).toBe(
      "https://sp.olx.com.br/grande-campinas/imoveis/oportunidade-de-um-linda-casa-nova-60-000-abaixo-do-valor-1389125359"
    );
  });
});
