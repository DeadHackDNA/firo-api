export const generatePrompt = (cvText: string) => {
  return `
    
    
    This is the context of the cv:
    ${cvText}
    `;
}