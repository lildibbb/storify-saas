import * as mime from 'mime-types';

export const getMimeFromExtension = (fileName: string): string => {
  const extension: string = fileName.substring(fileName.indexOf('.') + 1);
  return mime.contentType(extension) || '*/*';
};
