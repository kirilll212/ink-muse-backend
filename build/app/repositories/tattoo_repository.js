import Tattoo from '#models/tattoo';
export default class TattooRepository {
    async create(data) {
        return Tattoo.create(data);
    }
    async update(tattoo, data) {
        tattoo.merge(data);
        await tattoo.save();
        return tattoo;
    }
    async listByUser(userId) {
        return Tattoo.query().where('user_id', userId).orderBy('created_at', 'desc');
    }
    async findForUser(id, userId) {
        return Tattoo.query().where('id', id).andWhere('user_id', userId).first();
    }
    async delete(tattoo) {
        await tattoo.delete();
    }
}
//# sourceMappingURL=tattoo_repository.js.map