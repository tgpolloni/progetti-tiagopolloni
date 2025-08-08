import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function generateBriefingURL(projectId: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/briefing/${projectId}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // ignore and try fallback
  }

  // Fallback: elemento temporário
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    return false;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'In attesa di briefing':
      return 'bg-yellow-100 text-yellow-800';
    case 'In corso':
      return 'bg-blue-100 text-blue-800';
    case 'Pausa':
      return 'bg-gray-100 text-gray-800';
    case 'Completato':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'In attesa di briefing':
      return '⏳';
    case 'In corso':
      return '🔄';
    case 'Pausa':
      return '⏸️';
    case 'Completato':
      return '✅';
    default:
      return '❓';
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateCodiceFiscaleOrPIVA(code: string): boolean {
  // Validação básica para código fiscal italiano ou P.IVA
  const codiceFiscaleRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  const pivaRegex = /^[0-9]{11}$/;
  
  return codiceFiscaleRegex.test(code.toUpperCase()) || pivaRegex.test(code);
}