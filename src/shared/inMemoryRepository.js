export class InMemoryRepository {
  constructor(seed = []) {
    this.records = new Map(seed.map((record) => [record.id, { ...record }]));
  }

  list() {
    return [...this.records.values()].map((record) => ({ ...record }));
  }

  findById(id) {
    const record = this.records.get(id);
    return record ? { ...record } : null;
  }

  save(record) {
    this.records.set(record.id, { ...record });
    return { ...record };
  }

  update(id, patch) {
    const existing = this.findById(id);
    if (!existing) return null;
    return this.save({ ...existing, ...patch, updatedAt: new Date().toISOString() });
  }
}
