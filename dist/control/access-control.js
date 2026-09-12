import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const WHITELIST_FILE = path.join(DATA_DIR, 'whitelist.json');
const AVATAR_COLORS = [
    'bg-emerald-100 text-emerald-800',
    'bg-blue-100 text-blue-800',
    'bg-purple-100 text-purple-800',
    'bg-amber-100 text-amber-800',
    'bg-teal-100 text-teal-800',
    'bg-rose-100 text-rose-800',
];
export class AccessControlManager {
    accessMode = config.NODE_ENV === 'test' ? 'all' : 'whitelist';
    contacts = [];
    constructor() {
        this.loadFromDisk();
    }
    cleanPhone(phone) {
        return (phone || '').replace(/\D/g, '');
    }
    loadFromDisk() {
        try {
            if (fs.existsSync(WHITELIST_FILE)) {
                const raw = fs.readFileSync(WHITELIST_FILE, 'utf-8');
                const data = JSON.parse(raw);
                if (data.accessMode)
                    this.accessMode = data.accessMode;
                if (Array.isArray(data.contacts))
                    this.contacts = data.contacts;
                logger.info({ count: this.contacts.length, mode: this.accessMode }, 'Controle de acesso e contatos carregados do disco');
            }
        }
        catch (err) {
            logger.warn({ err }, 'Não foi possível carregar whitelist.json do disco, iniciando vazio');
        }
    }
    saveToDisk() {
        try {
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            const payload = {
                accessMode: this.accessMode,
                contacts: this.contacts,
            };
            fs.writeFileSync(WHITELIST_FILE, JSON.stringify(payload, null, 2), 'utf-8');
        }
        catch (err) {
            logger.error({ err }, 'Erro ao salvar whitelist.json no disco');
        }
    }
    getAccessMode() {
        return this.accessMode;
    }
    setAccessMode(mode) {
        this.accessMode = mode;
        this.saveToDisk();
        logger.info({ mode }, `Modo de acesso alterado para: ${mode}`);
    }
    getContacts() {
        return [...this.contacts];
    }
    addContact(name, phone) {
        const cleanNumber = this.cleanPhone(phone);
        const existingIndex = this.contacts.findIndex((c) => this.cleanPhone(c.phone) === cleanNumber);
        const now = new Date();
        const dateFormatted = now.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
        if (existingIndex >= 0) {
            const existing = this.contacts[existingIndex];
            existing.name = name || existing.name;
            this.saveToDisk();
            return existing;
        }
        const color = AVATAR_COLORS[this.contacts.length % AVATAR_COLORS.length];
        const newContact = {
            id: `contact-${Date.now()}`,
            name: name.trim() || `Contato ${cleanNumber.slice(-4)}`,
            phone: phone.trim(),
            addedDate: dateFormatted,
            avatarColor: color,
            totalConverted: 0,
        };
        this.contacts.unshift(newContact);
        this.saveToDisk();
        logger.info({ newContact }, 'Novo contato adicionado à whitelist');
        return newContact;
    }
    removeContact(idOrPhone) {
        const cleanTarget = this.cleanPhone(idOrPhone);
        const initialLen = this.contacts.length;
        this.contacts = this.contacts.filter((c) => c.id !== idOrPhone && this.cleanPhone(c.phone) !== cleanTarget);
        const removed = this.contacts.length < initialLen;
        if (removed) {
            this.saveToDisk();
            logger.info({ idOrPhone }, 'Contato removido da whitelist');
        }
        return removed;
    }
    incrementConverted(phone) {
        const clean = this.cleanPhone(phone);
        const contact = this.contacts.find((c) => this.cleanPhone(c.phone) === clean);
        if (contact) {
            contact.totalConverted = (contact.totalConverted || 0) + 1;
            this.saveToDisk();
        }
    }
    /**
     * Avalia se uma mensagem é permitida com base nas regras de acesso.
     */
    isAllowed(chatId, senderJid, isSelfChat) {
        // 1. Thiago conversando com ele mesmo (ou self-chat) sempre tem permissão total
        if (isSelfChat) {
            return { allowed: true };
        }
        // 2. Modo Apenas Eu: ninguém além de Thiago tem permissão
        if (this.accessMode === 'self') {
            return { allowed: false, reason: 'Access set to Only Me' };
        }
        // 3. Modo Liberados / Whitelist: apenas números presentes na lista
        if (this.accessMode === 'whitelist') {
            const cleanChat = this.cleanPhone(chatId.split('@')[0]);
            const cleanSender = this.cleanPhone(senderJid.split('@')[0]);
            const found = this.contacts.some((c) => {
                const cPhone = this.cleanPhone(c.phone);
                return (cleanChat.endsWith(cPhone) ||
                    cPhone.endsWith(cleanChat) ||
                    cleanSender.endsWith(cPhone) ||
                    cPhone.endsWith(cleanSender));
            });
            if (!found) {
                return { allowed: false, reason: 'User not on Whitelist' };
            }
            return { allowed: true };
        }
        // 4. Modo Público (all): todos têm permissão
        return { allowed: true };
    }
}
export const accessControl = new AccessControlManager();
//# sourceMappingURL=access-control.js.map