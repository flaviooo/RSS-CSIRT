import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AlertState } from '../types/alert.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = path.join(__dirname, '../../data/state.json');

const DEFAULT_STATE: AlertState = {
  lastAlertId: null,
  lastChecked: null,
  adminChatId: null,
};

function ensureDataDir(): void {
  const dataDir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readState(): AlertState {
  ensureDataDir();
  
  if (!fs.existsSync(STATE_FILE)) {
    return { ...DEFAULT_STATE };
  }
  
  try {
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading state file:', error);
    return { ...DEFAULT_STATE };
  }
}

function writeState(state: AlertState): void {
  ensureDataDir();
  
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error writing state file:', error);
    throw error;
  }
}

export function getLastAlertId(): string | null {
  return readState().lastAlertId;
}

export function setLastAlertId(id: string): void {
  const state = readState();
  state.lastAlertId = id;
  state.lastChecked = new Date().toISOString();
  writeState(state);
}

export function getAdminChatId(): string | null {
  return readState().adminChatId;
}

export function setAdminChatId(chatId: string): void {
  const state = readState();
  state.adminChatId = chatId;
  writeState(state);
}

export function getLastChecked(): string | null {
  return readState().lastChecked;
}
