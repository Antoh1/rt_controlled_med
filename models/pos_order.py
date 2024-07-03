from odoo import api, models, fields
from functools import partial


class PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def _order_fields(self, ui_order):
        result = super(PosOrder, self)._order_fields(ui_order)
        if ui_order.get('note'):
            result['note'] = ui_order['note']
        return result

    def _get_fields_for_order_line(self):
        fields = super(PosOrder, self)._get_fields_for_order_line()
        fields.extend(['patient_name', 'patient_no', 'hosp_name', 'doctor_name', 'doctor_no', 'prescription'])
        return fields


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    patient_name = fields.Char(string="Patient", ondelete='cascade')
    patient_no = fields.Char(string="Patient No", ondelete='cascade')
    hosp_name = fields.Char(string="Hospital", ondelete='cascade')
    doctor_name = fields.Char(string="Doctor", ondelete='cascade')
    doctor_no = fields.Char(string="Doctor's No", ondelete='cascade')
    prescription = fields.Char(string="Prescription", ondelete='cascade')


    def _export_for_ui(self, orderline):
        result = super()._export_for_ui(orderline)
        result['patient_name'] = orderline.patient_name
        result['patient_no'] = orderline.patient_no
        result['hosp_name'] = orderline.hosp_name
        result['doctor_name'] = orderline.doctor_name
        result['doctor_no'] = orderline.doctor_no
        result['prescription'] = orderline.prescription
        return result

    def export_for_ui(self):
        return self.mapped(self._export_for_ui) if self else []
