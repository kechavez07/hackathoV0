declare module 'qrcode' {
  export function toDataURL(
    text: string,
    options?: {
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
      margin?: number
      width?: number
      height?: number
    }
  ): Promise<string>
}
