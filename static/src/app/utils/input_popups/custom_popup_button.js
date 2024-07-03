/** @odoo-module **/

import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { _t } from "@web/core/l10n/translation";
import { onMounted, useRef, useState } from "@odoo/owl";

export class CustomPopupButton extends AbstractAwaitablePopup {
    static template = "point_of_sale.CustomPopupButton";
    static defaultProps = {
//        closePopup: _t("Cancel"),
        confirmText: _t("Save"),
//        cancelText: _t("Discard"),
        title: _t("Customer and Doctor Details"),
    };

    setup() {
        super.setup();
        this.state = useState({ patientName: "", patientNo: "",
                                Hosp: "", Doc: "", docTel: "", docPres: "" });
        this.inputRef = useRef("input");
        onMounted(this.onMounted);
    }
    onMounted() {
        this.inputRef.el.focus();
    }
    getPayload() {
        var data = {"patient" : this.state.patientName,
                    "patient_tel":this.state.patientNo,
                     "hospital":this.state.Hosp,
                      "doctor":this.state.Doc,
                       "doctor_tel":this.state.docTel,
                        "prescription":this.state.docPres
                        };
        return data;
    }
}