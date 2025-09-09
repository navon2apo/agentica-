import { api } from './client';

export const InvokeLLM = async ({ prompt, response_json_schema, temperature }) => {
  return api.post('/invoke-llm', { prompt, response_json_schema, temperature });
};

export const SendEmail = async (body) => api.post('/core/send-email', body);

export const UploadFile = async (body) => api.post('/core/upload-file', body);

export const GenerateImage = async (body) => api.post('/core/generate-image', body);

export const ExtractDataFromUploadedFile = async (body) => api.post('/core/extract-data', body);

export const CreateFileSignedUrl = async () => api.post('/core/create-file-signed-url');

export const UploadPrivateFile = async (body) => api.post('/core/upload-private-file', body);






