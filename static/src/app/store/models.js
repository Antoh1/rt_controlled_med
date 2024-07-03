/** @odoo-module */

import {Order} from "@point_of_sale/app/store/models";
import {Orderline} from "@point_of_sale/app/store/models";
import {patch} from "@web/core/utils/patch";
import {onMounted} from "@odoo/owl";
import { CustomPopupButton } from "@rt_controlled_med/app/utils/input_popups/custom_popup_button";
import { TextAreaPopup } from "@point_of_sale/app/utils/input_popups/textarea_popup";
import { _t } from "@web/core/l10n/translation";
// An order more or less represents the content of a customer's shopping cart (the OrderLines)
// plus the associated payment information (the Paymentlines)
// there is always an active ('selected') order in the Pos, a new one is created
// automaticaly once an order is completed and sent to the server.

var orderline_id = 1;

patch( Orderline.prototype, {
    setup(_defaultObj, options) {
        super.setup(...arguments);
        this.pos = options.pos;
        this.order = options.order;
        this.price_type = options.price_type;
        this.uuid = this.uuid || uuidv4();

        this.price_type = options.price_type || "original";
        if (options.json) {
            try {
                this.init_from_JSON(options.json);
            } catch (error) {
                console.error(
                    "ERROR: attempting to recover product ID",
                    options.json.product_id[0],
                    "not available in the point of sale. Correct the product or clean the browser cache."
                );
                throw error;
            }
            return;
        }
        this.product = options.product;
        this.tax_ids = options.tax_ids;
        this.set_product_lot(this.product);
        options.quantity ? this.set_quantity(options.quantity) : this.set_quantity(1);
        this.discount = 0;
        this.note = "";
        this.custom_attribute_value_ids = [];
        this.hasChange = false;
        this.skipChange = false;
        this.discountStr = "0";
        this.selected = false;
        this.price_extra = 0;
        this.full_product_name = "";
        this.id = orderline_id++;
        this.customerNote = this.customerNote || "";
        this.patientName = this.patientName || "";
        this.patientNo = this.patientNo || "";
        this.hospitalName = this.hospitalName || "";
        this.doctorName = this.doctorName || "";
        this.doctorNo = this.doctorNo || "";
        this.prescription = this.prescription || "";
        this.saved_quantity = 0;

        if (options.price) {
            this.set_unit_price(options.price);
        } else {
            this.set_unit_price(this.product.get_price(this.order.pricelist, this.get_quantity()));
        }
    },
    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        this.set_patient_name(json.patient_name);
        this.set_patient_no(json.patient_no);
        this.set_hosp_name(json.hosp_name);
        this.set_doctor_name(json.doctor_name);
        this.set_doctor_no(json.doctor_no);
        this.set_prescription(json.prescription);
    },
    clone() {
        var orderline = new Orderline(
            { env: this.env },
            {
                pos: this.pos,
                order: this.order,
                product: this.product,
                price: this.price,
            }
        );
        orderline.order = null;
        orderline.custom_attribute_value_ids = this.custom_attribute_value_ids;
        orderline.quantity = this.quantity;
        orderline.quantityStr = this.quantityStr;
        orderline.discount = this.discount;
        orderline.price = this.price;
        orderline.selected = false;
        orderline.price_type = this.price_type;
        orderline.customerNote = this.customerNote;
        orderline.patientName = this.patientName;
        orderline.patientNo = this.patientNo;
        orderline.hospitalName = this.hospitalName;
        orderline.doctorName = this.doctorName;
        orderline.doctorNo = this.doctorNo;
        orderline.prescription = this.prescription;
        return orderline;
    },
    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        json.patient_name = this.get_patient_name();
        json.patient_no = this.get_patient_no();
        json.hosp_name = this.get_hosp_name();
        json.doctor_name = this.get_doctor_name();
        json.doctor_no = this.get_doctor_no();
        json.prescription = this.get_prescription();
        return json;
    },
    set_patient_name(pnote) {
        this.patientName = pnote || "";
    },
    get_patient_name() {
        return this.patientName;
    },
    set_patient_no(pnum) {
        this.patientNo = pnum || "";
    },
    get_patient_no() {
        return this.patientNo;
    },
    set_hosp_name(hname) {
        this.hospitalName = hname || "";
    },
    get_hosp_name() {
        return this.hospitalName;
    },
    set_doctor_name(dname) {
        this.doctorName = dname || "";
    },
    get_doctor_name() {
        return this.doctorName;
    },
    set_doctor_no(dnum) {
        this.doctorNo = dnum || "";
    },
    get_doctor_no() {
        return this.doctorNo;
    },
    set_prescription(pres) {
        this.prescription = pres || "";
    },
    get_prescription() {
        return this.prescription;
    },
    getDisplayData() {
        return {
            productName: this.get_full_product_name(),
            price:
                this.get_discount_str() === "100"
                    ? "free"
                    : this.env.utils.formatCurrency(this.get_display_price()),
            qty: this.get_quantity_str(),
            unit: this.get_unit().name,
            unitPrice: this.env.utils.formatCurrency(this.get_unit_display_price()),
            oldUnitPrice: this.env.utils.formatCurrency(this.get_old_unit_display_price()),
            discount: this.get_discount_str(),
            customerNote: this.get_customer_note(),
            patientName: this.get_patient_name(),
            patientNo: this.get_patient_no(),
            hospitalName: this.get_hosp_name(),
            doctorName: this.get_doctor_name(),
            doctorNo: this.get_doctor_no(),
            prescription: this.get_prescription(),
            internalNote: this.getNote(),
            comboParent: this.comboParent?.get_full_product_name(),
            pack_lot_lines: this.get_lot_lines(),
            price_without_discount: this.env.utils.formatCurrency(
                this.getUnitDisplayPriceBeforeDiscount()
            ),
            attributes: this.attribute_value_ids
                ? this.findAttribute(this.attribute_value_ids, this.custom_attribute_value_ids)
                : [],
        };
    }

});

patch(Order.prototype, {
    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        json.note = this.note
        return json;
    },

    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        this.note = json.note;
    },

    export_for_printing() {
        const result = super.export_for_printing(...arguments);
        result.note = this.note;
        return result;
    },

    set_order_note(note) {
        this.note = note || "";
    },
    async pay() {

        let restrict = []
        for (const orderlineIdx in this.orderlines) {
            const orderline = this.orderlines[orderlineIdx];
            const product = orderline.get_product();
            if (product.categ_id[0] == 5){
                restrict.push(orderline)
            }

            }

        if (restrict.length > 0 ) {
            for (const order_linein in restrict){
                const l_prod = restrict[order_linein].get_product();
                const ord_line = restrict[order_linein]
                const selectedOrderline = this.pos.get_order().get_selected_orderline();
                const { confirmed, payload } = await this.env.services.popup.add(CustomPopupButton, {
                        title: _t("Add details for " + l_prod.display_name),
                    });
                    if (!payload['patient'] && !payload['patient_tel'] && !payload['doctor_tel'] && !payload['prescription']){
                        for (let i =0; i <= 10; i++){
                            const { confirmed, payload } = await this.env.services.popup.add(CustomPopupButton, {
                                     title: _t("Add details for " + l_prod.display_name),
                                    });
                            if (payload['patient'] && payload['patient_tel'] && payload['doctor_tel'] && payload['prescription']){
                                if (confirmed) {
                                    let pnote = payload['patient'];
                                    let pnum = payload['patient_tel'];
                                    let hname = payload['hospital'];
                                    let dname = payload['doctor'];
                                    let dnum = payload['doctor_tel'];
                                    let pres = payload['prescription'];

                                    ord_line.set_patient_name(pnote);
                                    ord_line.set_patient_no(pnum);
                                    ord_line.set_hosp_name(hname);
                                    ord_line.set_doctor_name(dname);
                                    ord_line.set_doctor_no(dnum);
                                    ord_line.set_prescription(pres);
                                    this.pos.mobile_pane = "right";
                                    this.env.services.pos.showScreen("PaymentScreen");
                                    break;
                                };
                            };
                        };
                    };
                    if (confirmed && payload['patient'] && payload['prescription'] && payload['doctor_tel'] && payload['patient_tel']){
                                    let pnote = payload['patient'];
                                    let pnum = payload['patient_tel'];
                                    let hname = payload['hospital'];
                                    let dname = payload['doctor'];
                                    let dnum = payload['doctor_tel'];
                                    let pres = payload['prescription'];

                                    ord_line.set_patient_name(pnote);
                                    ord_line.set_patient_no(pnum);
                                    ord_line.set_hosp_name(hname);
                                    ord_line.set_doctor_name(dname);
                                    ord_line.set_doctor_no(dnum);
                                    ord_line.set_prescription(pres);
                                    this.pos.mobile_pane = "right";
                                    this.env.services.pos.showScreen("PaymentScreen");
                    };
            };
        };
//                    if((payload[0]["PATIENT : "] == "") && (payload[3]["   DOCTOR : "] == "") && (payload[4]["   DOCTOR TEL : "] == "")){
//                     for (let i =0; i <= 10; i++){
//                           const { confirmed, payload } = await this.env.services.popup.add(CustomPopupButton, {
//                        title: _t("Add details for " + l_prod.display_name),
//                        });
//                        if((payload[3]["   DOCTOR : "] !== "") && (payload[0]["PATIENT : "] !== "") && (payload[4]["   DOCTOR TEL : "] !== "")){
//                           if (confirmed) {
//                        console.log(payload)
//                        let pnote = ""
////                        for (var t = 0; t < payload.length; t++) {
////                             var obj = payload[t];
////                              for (var key in obj) {
////                                     pnote = pnote + key + obj[key]
////                                     console.log(key, obj[key])
////                                            }
////                              }
//
//                        ord_line.set_patient_name(pnote);
//                        this.pos.mobile_pane = "right";
//                        this.env.services.pos.showScreen("PaymentScreen");
//                    };
//                           break;
//                           }
//                       }
//
//                    }

//                    if (confirmed && (payload[3]["   DOCTOR : "] !== "") && (payload[0]["PATIENT : "] !== "") && (payload[4]["   DOCTOR TEL : "] !== "")) {
//                        console.log(payload)
//                        let pnote = ""
//                        for (var i = 0; i < payload.length; i++) {
//                             var obj = payload[i];
//                              for (var key in obj) {
//                                     pnote = pnote + key + obj[key]
//                                            }
//                              }
//
//                        ord_line.set_patient_name(pnote);
//                        this.pos.mobile_pane = "right";
//                        this.env.services.pos.showScreen("PaymentScreen");
//                    }
//            }
//        }
        if (
            this.orderlines.some(
                (line) => line.get_product().tracking !== "none" && !line.has_valid_product_lot()
            ) &&
            (this.pos.picking_type.use_create_lots || this.pos.picking_type.use_existing_lots)
        ) {
            const { confirmed } = await this.env.services.popup.add(ConfirmPopup, {
                title: _t("Some Serial/Lot Numbers are missing"),
                body: _t(
                    "You are trying to sell products with serial/lot numbers, but some of them are not set.\nWould you like to proceed anyway?"
                ),
                confirmText: _t("Yes"),
                cancelText: _t("No"),
            });
            if (confirmed) {
                this.pos.mobile_pane = "right";
                this.env.services.pos.showScreen("PaymentScreen");
            }
        }

         else {
            this.pos.mobile_pane = "right";
            this.env.services.pos.showScreen("PaymentScreen");
        }
    }
});
