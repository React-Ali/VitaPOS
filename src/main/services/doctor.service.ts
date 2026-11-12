import { getDb } from '../database/connection'

export const doctorService = {
  list() {
    return getDb().prepare('SELECT * FROM doctors ORDER BY name ASC').all()
  },
  create(input: any) {
    return getDb().prepare(
      'INSERT INTO doctors (name, pmdc_no, hospital, phone, specialty, email, notes) VALUES (@name, @pmdc_no, @hospital, @phone, @specialty, @email, @notes)'
    ).run(input)
  },
  update(id: number, input: any) {
    return getDb().prepare(
      'UPDATE doctors SET name=@name, pmdc_no=@pmdc_no, hospital=@hospital, phone=@phone, specialty=@specialty, email=@email, notes=@notes WHERE id=@id'
    ).run({ ...input, id })
  },
  delete(id: number) {
    return getDb().prepare('DELETE FROM doctors WHERE id = ?').run(id)
  },
  getPrescriptions() {
    return getDb().prepare(`
      SELECT cr.*, m.name as medicine_name, d.name as doctor_name, d.pmdc_no, s.invoice_no, s.created_at
      FROM controlled_register cr
      JOIN medicines m ON m.id = cr.medicine_id
      LEFT JOIN doctors d ON d.id = cr.doctor_id
      JOIN sales s ON s.id = cr.sale_id
      ORDER BY cr.id DESC
    `).all()
  }
}