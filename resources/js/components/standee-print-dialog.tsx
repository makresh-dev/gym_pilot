import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, QrCode, Building2, CheckCircle2, Smartphone } from 'lucide-react';

export type StandeeType = 'checkin' | 'payment';

export interface StandeeBankDetails {
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    bankIfscCode?: string | null;
}

export interface StandeePrintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: StandeeType | null;
    organizationName: string;
    checkinPayload?: string;
    upiId?: string | null;
    upiQrUrl?: string | null;
    bankDetails?: StandeeBankDetails;
}

export function printStandee(type: StandeeType) {
    const sourceId =
        type === 'checkin'
            ? 'gympilot-print-source-checkin'
            : 'gympilot-print-source-payment';
    const element = document.getElementById(sourceId);
    if (!element) {
        window.print();
        return;
    }

    let printFrame = document.getElementById(
        'gympilot-standee-print-frame'
    ) as HTMLIFrameElement;
    if (printFrame) {
        printFrame.remove();
    }

    printFrame = document.createElement('iframe');
    printFrame.id = 'gympilot-standee-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    const title =
        type === 'checkin'
            ? 'GymPilot - Check-in QR Standee'
            : 'GymPilot - Official UPI Payment Standee';

    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 10mm;
                }
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                body {
                    background: #ffffff;
                    color: #0f172a;
                    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    padding: 16px;
                }
                .standee-card {
                    width: 100%;
                    max-width: 460px;
                    border: 2.5px solid #0f172a;
                    border-radius: 28px;
                    padding: 34px 28px;
                    text-align: center;
                    background: #ffffff;
                }
                .badge-pill {
                    display: inline-block;
                    background: #0f172a;
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    padding: 5px 14px;
                    border-radius: 9999px;
                    margin-bottom: 14px;
                }
                .gym-name {
                    font-size: 26px;
                    font-weight: 800;
                    letter-spacing: -0.025em;
                    color: #0f172a;
                    margin-bottom: 4px;
                    line-height: 1.2;
                }
                .standee-subtitle {
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    margin-bottom: 18px;
                }
                .qr-frame {
                    display: inline-flex;
                    justify-content: center;
                    align-items: center;
                    background: #ffffff;
                    padding: 16px;
                    border-radius: 22px;
                    border: 2px solid #e2e8f0;
                    margin: 0 auto 18px;
                }
                .qr-frame svg {
                    display: block;
                    width: 250px !important;
                    height: 250px !important;
                }
                .upi-highlight {
                    background: #f8fafc;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 14px;
                    padding: 10px 14px;
                    margin-bottom: 16px;
                }
                .upi-label {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #64748b;
                    margin-bottom: 3px;
                }
                .upi-id {
                    font-size: 18px;
                    font-weight: 800;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    color: #0f172a;
                    letter-spacing: -0.01em;
                }
                .apps-row {
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: 16px;
                }
                .app-pill {
                    font-size: 10px;
                    font-weight: 600;
                    background: #f1f5f9;
                    color: #334155;
                    padding: 3px 8px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                }
                .bank-section {
                    text-align: left;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 12px 14px;
                    margin-bottom: 16px;
                }
                .bank-header {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #475569;
                    margin-bottom: 6px;
                    padding-bottom: 4px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .bank-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px 12px;
                }
                .bank-field-lbl {
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #64748b;
                }
                .bank-field-val {
                    font-size: 11px;
                    font-weight: 600;
                    color: #0f172a;
                }
                .steps-section {
                    text-align: left;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 14px;
                    margin-bottom: 18px;
                }
                .steps-heading {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #64748b;
                    margin-bottom: 8px;
                }
                .step-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin-bottom: 6px;
                    font-size: 11px;
                    color: #334155;
                    line-height: 1.4;
                }
                .step-item:last-child {
                    margin-bottom: 0;
                }
                .step-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 18px;
                    height: 18px;
                    background: #0f172a;
                    color: #ffffff;
                    font-size: 10px;
                    font-weight: 700;
                    border-radius: 9999px;
                    flex-shrink: 0;
                }
                .footer-note {
                    border-top: 1px solid #e2e8f0;
                    padding-top: 12px;
                    font-size: 10px;
                    color: #64748b;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .brand-name {
                    font-weight: 700;
                    color: #0f172a;
                }
            </style>
        </head>
        <body>
            ${element.innerHTML}
        </body>
        </html>
    `);
    doc.close();

    setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
    }, 250);
}

export function StandeePrintDialog({
    open,
    onOpenChange,
    type,
    organizationName,
    checkinPayload = '',
    upiId,
    upiQrUrl,
    bankDetails,
}: StandeePrintDialogProps) {
    const hasBankDetails =
        bankDetails &&
        (bankDetails.bankName ||
            bankDetails.bankAccountNumber ||
            bankDetails.bankIfscCode);

    return (
        <>
            {/* Off-screen source templates for pixel-perfect printing */}
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    left: '-9999px',
                    top: '-9999px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    opacity: 0,
                    zIndex: -1,
                }}
            >
                {/* 1. Check-in Standee Print Source */}
                <div id="gympilot-print-source-checkin">
                    <div className="standee-card">
                        <div className="badge-pill">
                            GYMPILOT ACCESS • VERIFIED CHECK-IN
                        </div>
                        <div className="gym-name">{organizationName}</div>
                        <div className="standee-subtitle">MEMBER SELF CHECK-IN</div>

                        <div className="qr-frame">
                            <QRCodeSVG
                                value={checkinPayload || 'gympilot://checkin'}
                                size={250}
                                level="Q"
                                includeMargin={false}
                            />
                        </div>

                        <div className="steps-section">
                            <div className="steps-heading">
                                3 Simple Steps to Check In
                            </div>
                            <div className="step-item">
                                <span className="step-badge">1</span>
                                <span>
                                    Open your phone camera or the GymPilot mobile
                                    app.
                                </span>
                            </div>
                            <div className="step-item">
                                <span className="step-badge">2</span>
                                <span>
                                    Tap &ldquo;Check In&rdquo; on your screen.
                                </span>
                            </div>
                            <div className="step-item">
                                <span className="step-badge">3</span>
                                <span>
                                    Scan this QR code to mark your workout
                                    attendance today.
                                </span>
                            </div>
                        </div>

                        <div className="footer-note">
                            <span>
                                For desk assistance, please speak with reception.
                            </span>
                            <span className="brand-name">Powered by GymPilot</span>
                        </div>
                    </div>
                </div>

                {/* 2. Payment Standee Print Source */}
                <div id="gympilot-print-source-payment">
                    <div className="standee-card">
                        <div className="badge-pill">
                            OFFICIAL UPI PAYMENT COUNTER
                        </div>
                        <div className="gym-name">{organizationName}</div>
                        <div className="standee-subtitle">
                            SCAN &amp; PAY WITH ANY UPI APP
                        </div>

                        <div className="apps-row">
                            <span className="app-pill">Google Pay</span>
                            <span className="app-pill">PhonePe</span>
                            <span className="app-pill">Paytm</span>
                            <span className="app-pill">BHIM UPI</span>
                            <span className="app-pill">Amazon Pay</span>
                            <span className="app-pill">Any Bank App</span>
                        </div>

                        <div className="qr-frame">
                            <QRCodeSVG
                                value={
                                    upiQrUrl ||
                                    (upiId
                                        ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(organizationName)}&cu=INR`
                                        : '')
                                }
                                size={250}
                                level="M"
                                includeMargin={false}
                            />
                        </div>

                        {upiId && (
                            <div className="upi-highlight">
                                <div className="upi-label">
                                    Official UPI VPA ID
                                </div>
                                <div className="upi-id">{upiId}</div>
                            </div>
                        )}

                        {hasBankDetails && (
                            <div className="bank-section">
                                <div className="bank-header">
                                    DIRECT BANK WIRE (NEFT / RTGS / IMPS)
                                </div>
                                <div className="bank-grid">
                                    {bankDetails.bankName && (
                                        <div>
                                            <div className="bank-field-lbl">
                                                Bank Name
                                            </div>
                                            <div className="bank-field-val">
                                                {bankDetails.bankName}
                                            </div>
                                        </div>
                                    )}
                                    {bankDetails.bankAccountName && (
                                        <div>
                                            <div className="bank-field-lbl">
                                                A/C Name
                                            </div>
                                            <div className="bank-field-val">
                                                {bankDetails.bankAccountName}
                                            </div>
                                        </div>
                                    )}
                                    {bankDetails.bankAccountNumber && (
                                        <div>
                                            <div className="bank-field-lbl">
                                                A/C Number
                                            </div>
                                            <div className="bank-field-val">
                                                {bankDetails.bankAccountNumber}
                                            </div>
                                        </div>
                                    )}
                                    {bankDetails.bankIfscCode && (
                                        <div>
                                            <div className="bank-field-lbl">
                                                IFSC Code
                                            </div>
                                            <div className="bank-field-val">
                                                {bankDetails.bankIfscCode}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="footer-note">
                            <span>
                                Instant digital receipt issued upon payment.
                            </span>
                            <span className="brand-name">Powered by GymPilot</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive On-screen Standee Preview Modal */}
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                            <QrCode className="size-4 text-primary" />
                            <span>
                                {type === 'checkin'
                                    ? 'Check-in QR Standee Preview'
                                    : 'Payment QR Standee Preview'}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {type === 'checkin'
                                ? 'Preview of the entry standee for member self check-in.'
                                : 'Preview of the desk standee for scan-and-pay UPI collections.'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Preview Standee Display Frame */}
                    <div className="mt-3 rounded-2xl border-2 border-slate-900/80 bg-white p-6 text-center text-slate-900 shadow-sm dark:border-slate-300 dark:bg-white dark:text-slate-900">
                        {type === 'checkin' ? (
                            <div>
                                <span className="inline-block rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                                    GYMPILOT ACCESS • VERIFIED CHECK-IN
                                </span>
                                <h3 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900">
                                    {organizationName}
                                </h3>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    MEMBER SELF CHECK-IN
                                </p>

                                <div className="my-4 inline-flex justify-center rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                                    <QRCodeSVG
                                        value={checkinPayload || 'gympilot://checkin'}
                                        size={180}
                                        level="Q"
                                        includeMargin={false}
                                    />
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                        How to Check In
                                    </span>
                                    <div className="space-y-1.5 text-xs text-slate-600">
                                        <div className="flex items-start gap-2">
                                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                                                1
                                            </span>
                                            <span>
                                                Open your camera or the GymPilot app.
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                                                2
                                            </span>
                                            <span>Tap &ldquo;Check In&rdquo; on your screen.</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                                                3
                                            </span>
                                            <span>
                                                Scan this QR code to mark attendance.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <span className="inline-block rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                                    OFFICIAL UPI PAYMENT COUNTER
                                </span>
                                <h3 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900">
                                    {organizationName}
                                </h3>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    SCAN &amp; PAY WITH ANY UPI APP
                                </p>

                                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                                    {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay'].map(
                                        (app) => (
                                            <span
                                                key={app}
                                                className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                                            >
                                                {app}
                                            </span>
                                        )
                                    )}
                                </div>

                                <div className="my-4 inline-flex justify-center rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                                    <QRCodeSVG
                                        value={
                                            upiQrUrl ||
                                            (upiId
                                                ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(organizationName)}&cu=INR`
                                                : '')
                                        }
                                        size={180}
                                        level="M"
                                        includeMargin={false}
                                    />
                                </div>

                                {upiId && (
                                    <div className="rounded-xl border border-slate-300 bg-slate-50 p-2.5">
                                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                            UPI ID / VPA
                                        </span>
                                        <span className="font-mono text-base font-bold text-slate-900">
                                            {upiId}
                                        </span>
                                    </div>
                                )}

                                {hasBankDetails && (
                                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left text-xs">
                                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200 mb-2">
                                            Bank Transfer (NEFT / IMPS)
                                        </span>
                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                            {bankDetails.bankName && (
                                                <div>
                                                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">
                                                        Bank
                                                    </span>
                                                    <span className="font-medium text-slate-800">
                                                        {bankDetails.bankName}
                                                    </span>
                                                </div>
                                            )}
                                            {bankDetails.bankAccountNumber && (
                                                <div>
                                                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">
                                                        A/C No.
                                                    </span>
                                                    <span className="font-mono font-medium text-slate-800">
                                                        {bankDetails.bankAccountNumber}
                                                    </span>
                                                </div>
                                            )}
                                            {bankDetails.bankIfscCode && (
                                                <div>
                                                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">
                                                        IFSC
                                                    </span>
                                                    <span className="font-mono font-medium text-slate-800">
                                                        {bankDetails.bankIfscCode}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-[10px] text-slate-500">
                            <span>Ready to print for acrylic counter frame</span>
                            <span className="font-bold text-slate-800">
                                GymPilot
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="mt-3 flex flex-row items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                                if (type) {
                                    printStandee(type);
                                }
                            }}
                            className="gap-1.5"
                        >
                            <Printer className="size-3.5" />
                            <span>
                                {type === 'checkin'
                                    ? 'Print Check-in Standee'
                                    : 'Print Payment Standee'}
                            </span>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
