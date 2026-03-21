/**
 * Interfaccia per un alert normalizzato (dopo parsing RSS).
 * Rappresenta un advisory di sicurezza CVE.
 */
export interface Alert {
  id: string;                  // ID univoco generato (base64 del link)
  title: string;               // Titolo dell'advisory
  link: string;                // URL all'advisory completo
  pubDate: string;             // Data di pubblicazione originale (RFC 822)
  description: string;         // Descrizione/sommario (max 500 chars)
  severity?: Severity;         // Livello di severità (opzionale)
  cveIds: string[];           // Lista di CVE IDs menzionati
  updatedAt?: string;          // Data di aggiornamento (dc:date ISO 8601)
}

/**
 * Tipo per i livelli di severità delle vulnerabilità.
 * Supporta sia inglese che italiano.
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

/**
 * Stato del sistema per la gestione degli alert.
 * Utilizzato per tracciare l'ultimo alert processato.
 */
export interface AlertState {
  lastAlertId: string | null;   // ID dell'ultimo alert processato
  lastChecked: string | null;   // Timestamp ultimo check
  adminChatId: string | null;   // Chat ID dell'amministratore
}

/**
 * Interfaccia per un item RSS raw (prima del parsing).
 * Include tutti i campi possibili dal feed ACN.
 */
export interface RssItem {
  title?: string;              // Titolo dell'advisory
  link?: string;              // URL all'advisory
  pubDate?: string;           // Data di pubblicazione (RFC 822)
  content?: string;            // Contenuto HTML completo
  contentSnippet?: string;     // Anteprima testo (plain text)
  guid?: string;               // Identificatore univoco RSS
  isoDate?: string;           // Data in formato ISO 8601
  dcDate?: string;            // Dublin Core: data (mappato da dc:date)
  dcCreator?: string;         // Dublin Core: creatore/autore
  isoDatePubDate?: string;    // Data ISO alternativa
  [key: string]: unknown;     // Indice per campi dinamici
}
