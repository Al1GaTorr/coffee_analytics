import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export class FileRepository {
  constructor(filePath, seed = []) {
    this.filePath = filePath;
    mkdirSync(dirname(filePath), { recursive: true });
    if (!existsSync(filePath)) {
      writeFileSync(filePath, JSON.stringify(seed, null, 2));
    }
  }

  list() {
    return this.read().map((record) => ({ ...record }));
  }

  findById(id) {
    const record = this.read().find((candidate) => candidate.id === id);
    return record ? { ...record } : null;
  }

  save(record) {
    const records = this.read();
    const index = records.findIndex((candidate) => candidate.id === record.id);
    const next = { ...record };
    if (index >= 0) records[index] = next;
    else records.push(next);
    this.write(records);
    return { ...next };
  }

  update(id, patch) {
    const existing = this.findById(id);
    if (!existing) return null;
    return this.save({ ...existing, ...patch, updatedAt: new Date().toISOString() });
  }

  delete(id) {
    const records = this.read();
    const next = records.filter((record) => record.id !== id);
    if (next.length === records.length) return false;
    this.write(next);
    return true;
  }

  read() {
    return JSON.parse(readFileSync(this.filePath, 'utf8'));
  }

  write(records) {
    writeFileSync(this.filePath, JSON.stringify(records, null, 2));
  }
}
