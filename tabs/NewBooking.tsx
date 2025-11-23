
import React, { useState, useEffect } from 'react';
// FIX: Aliased ServiceUIType to ServiceCategory to resolve the missing export.
import { Booking, Package, Service, ServiceConfig, Tab, Shift, BookingTier, ServiceUIType as ServiceCategory, PaymentMethod } from '../types';
import { SERVICE_CATEGORY_STYLES } from '../constants';
import { printHtmlAsPDF } from '../utils/download';
import ServiceEditor from '../components/control-center/ServiceEditor';

interface NewBookingProps {
    packages: Package[];
    servicesConfig: ServiceConfig;
    setServicesConfig: React.Dispatch<React.SetStateAction<ServiceConfig>>;
    addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    setActiveTab: (tab: Tab) => void;
    onAddBooking: (booking: Booking) => void;
    onUpdateBooking: (booking: Booking) => void;
    bookingToEdit: Booking | null;
    onClearEdit: () => void;
    bookings: Booking[];
    currentSeason: string;
    preselectedDate: string | null;
    onClearPreselectedDate: () => void;
}

const NewBooking: React.FC<NewBookingProps> = ({ 
    packages, servicesConfig, setServicesConfig, addToast, setActiveTab, 
    onAddBooking, onUpdateBooking, bookingToEdit, onClearEdit,
    bookings, currentSeason, preselectedDate, onClearPreselectedDate
}) => {
    const isEditMode = !!bookingToEdit;
    const [isServiceEditorOpen, setIsServiceEditorOpen] = useState(false);
    const [newServiceCategory, setNewServiceCategory] = useState<ServiceCategory | null>(null);

    const getInitialState = () => {
        if (isEditMode) {
            const pkg = packages.find(p => p.price === bookingToEdit.rate && p.name.includes(bookingToEdit.tier));
            const totalPaid = bookingToEdit.payments.reduce((sum, p) => sum + (p.type === 'Received' ? p.amount : -p.amount), 0);
            return {
                eventDate: bookingToEdit.eventDate,
                shift: bookingToEdit.shift,
                clientName: bookingToEdit.clientName,
                contact: bookingToEdit.contact,
                eventType: bookingToEdit.eventType,
                guests: bookingToEdit.guests,
                packageId: pkg?.id || '',
                rate: bookingToEdit.rate,
                discount: bookingToEdit.discount || 0,
                advance: totalPaid, // For display in the single field
                services: bookingToEdit.services || {},
                // Payment fields not used in edit mode, but initialized for consistency
                initialPaymentMode: 'Cash',
                initialPaymentMedium: 'UPI',
                initialPaymentRef: '',
            };
        }
        return {
            eventDate: preselectedDate || '',
            shift: '' as Shift,
            clientName: '',
            contact: '',
            eventType: '',
            guests: 100,
            packageId: '',
            rate: 0,
            discount: 0,
            advance: 0,
            services: {} as Record<string, boolean | string | number>,
            initialPaymentMode: 'Cash',
            initialPaymentMedium: 'UPI',
            initialPaymentRef: '',
        };
    };

    const [formState, setFormState] = useState(getInitialState);
    const [bookingId, setBookingId] = useState('');
    const [consentChecked, setConsentChecked] = useState(false);

    const seasonForNewBooking = currentSeason === 'All' ? '2025-26' : currentSeason;

    useEffect(() => {
        if (preselectedDate) {
            setFormState(prev => ({ ...prev, eventDate: preselectedDate }));
            addToast(`Selected date ${new Date(preselectedDate).toLocaleDateString('en-IN', { timeZone: 'UTC' })} pre-filled.`, 'info');
            onClearPreselectedDate();
        }
    }, [preselectedDate, onClearPreselectedDate, addToast]);

    useEffect(() => {
        if (isEditMode) {
            setBookingId(bookingToEdit.bookingId);
        } else {
            const seasonShort = seasonForNewBooking.replace('-', '/');
            
            const seasonBookings = bookings.filter(b => b.season === seasonForNewBooking);
            const maxId = seasonBookings.reduce((max, b) => {
                const idParts = b.bookingId.split('/');
                if (idParts.length > 0) {
                    const num = parseInt(idParts[idParts.length - 1], 10);
                    if (!isNaN(num) && num > max) {
                        return num;
                    }
                }
                return max;
            }, 0);

            const nextNumber = String(maxId + 1).padStart(3, '0');
            setBookingId(`HG/${seasonShort}/${nextNumber}`);
        }
    }, [bookingToEdit, isEditMode, bookings, currentSeason, seasonForNewBooking]);
    
    // Clear edit state when component unmounts if we were in edit mode
    useEffect(() => {
        return () => {
            if (isEditMode) {
                onClearEdit();
            }
        };
    }, [isEditMode, onClearEdit]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
        setFormState(prev => ({ ...prev, [name]: finalValue }));
    };

    const handlePackageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const pkgId = e.target.value;
        const selectedPackage = packages.find(p => p.id === pkgId);
        if (selectedPackage) {
            setFormState(prev => ({
                ...prev,
                packageId: pkgId,
                rate: selectedPackage.price,
                discount: 0, // Reset discount when new package is selected
                services: { ...selectedPackage.services }
            }));
            addToast(`Package "${selectedPackage.name}" applied.`, 'info');
        } else {
             setFormState(prev => ({ ...prev, packageId: '', rate: 0, services: {} }));
        }
    };
    
    const handleServiceChange = (id: string, value: string | number | boolean) => {
        setFormState(prev => ({
            ...prev,
            services: { ...prev.services, [id]: value }
        }));
    };

    const getTierFromRate = (rate: number): BookingTier => {
        if (rate >= 180000) return 'Diamond';
        if (rate >= 145000) return 'Gold';
        return 'Silver';
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!consentChecked) {
            addToast('You must confirm the details by checking the box before submitting.', 'warning');
            return;
        }
        
        if (!formState.eventDate || !formState.clientName || !formState.contact || !formState.rate) {
            addToast('Please fill in all required fields.', 'warning');
            return;
        }

        // Handle Payment Construction
        let paymentMethod: PaymentMethod = 'Cash';
        let paymentNotes = '';

        if (formState.advance > 0 && !isEditMode) {
            if (formState.initialPaymentMode === 'Bank') {
                const medium = formState.initialPaymentMedium; // UPI, Cheque, Card, Other
                const ref = formState.initialPaymentRef;

                if (medium === 'UPI') paymentMethod = 'UPI';
                else if (medium === 'Card') paymentMethod = 'Card';
                else paymentMethod = 'Bank'; // Cheque or Other maps to Bank with notes

                const notesParts = [];
                if (medium && medium !== 'Other') notesParts.push(medium);
                if (ref) {
                    const prefix = medium === 'Cheque' ? 'Cheque No' : 'Ref/UTR';
                    notesParts.push(`${prefix}: ${ref}`);
                }
                paymentNotes = notesParts.join(' - ');
            } else {
                paymentMethod = 'Cash';
            }
        }

        const initialPayment = (formState.advance > 0 && !isEditMode) ? [{ 
            id: `pay-${Date.now()}`,
            date: formState.eventDate, // Assume initial payment on booking day
            amount: formState.advance,
            method: paymentMethod,
            type: 'Received' as const,
            notes: paymentNotes
        }] : [];

        const bookingData: Booking = {
            ...(bookingToEdit || {}), // Keep existing data like status
            bookingId,
            clientName: formState.clientName,
            status: bookingToEdit?.status || 'Upcoming',
            tier: getTierFromRate(formState.rate),
            season: bookingToEdit?.season || seasonForNewBooking,
            eventDate: formState.eventDate,
            contact: formState.contact,
            rate: formState.rate,
            discount: formState.discount,
            payments: isEditMode ? bookingToEdit.payments : initialPayment,
            expenses: bookingToEdit?.expenses || formState.rate * 0.6, // Keep existing or estimate
            eventType: formState.eventType || 'Unspecified',
            guests: formState.guests,
            shift: formState.shift || 'Night',
            services: formState.services,
        };

        if (isEditMode) {
            const updatedBooking = { ...bookingData, payments: bookingToEdit.payments }; // Ensure payments array is preserved on edit.
            onUpdateBooking(updatedBooking);
            addToast(`Booking for ${formState.clientName} updated successfully!`, 'success');
        } else {
            onAddBooking(bookingData);
            addToast(`Booking for ${formState.clientName} created successfully!`, 'success');
        }
        
        onClearEdit();
        setFormState(getInitialState());
        setConsentChecked(false);
        setActiveTab('bookings');
    };

    const handleReset = () => {
        if (isEditMode) {
            onClearEdit();
            setActiveTab('new-booking');
        } else {
            setFormState(getInitialState());
        }
        setConsentChecked(false);
    }
    
    const handleOpenServiceEditor = (category: ServiceCategory) => {
        setNewServiceCategory(category);
        setIsServiceEditorOpen(true);
    };

    const handleSaveNewService = (category: ServiceCategory, service: Service) => {
        setServicesConfig(prev => {
            const newConfig = { ...prev };
            newConfig[category] = [...newConfig[category], service];
            return newConfig;
        });

        let defaultValue: string | number | boolean = false;
        if (service.type === 'number') {
            defaultValue = 0;
        } else if (service.type === 'dropdown') {
            defaultValue = service.options?.[0] || '';
        }
        handleServiceChange(service.id, defaultValue);

        addToast(`New service "${service.name}" added successfully!`, 'success');
        setIsServiceEditorOpen(false);
        setNewServiceCategory(null);
    };

    const generateProformaHtml = () => {
        const { clientName, eventDate, eventType, guests, shift, rate, discount, advance, services } = formState;
        const finalDiscount = discount || 0;
        const balance = rate - finalDiscount - advance;
    
        const serviceHtml = Object.entries(servicesConfig)
            .map(([category, serviceList]) => {
                const includedServices = serviceList.filter(s => {
                    const value = services[s.id];
                    if (s.type === 'checkbox') return value === true;
                    if (s.type === 'number') return typeof value === 'number' && value > 0;
                    if (s.type === 'dropdown') return typeof value === 'string' && value !== 'None' && value !== s.options?.[0];
                    return false;
                });
    
                if (includedServices.length === 0) return '';
    
                return `
                    <div class="category">
                        <h3>${SERVICE_CATEGORY_STYLES[category as ServiceCategory].icon} ${category.replace('-', ' ')}</h3>
                        <ul>
                            ${includedServices.map(s => {
                                const value = services[s.id];
                                let displayValue = '';
                                if (s.type === 'number') displayValue = `(Qty: ${value})`;
                                if (s.type === 'dropdown') displayValue = `(${value})`;
                                return `<li>${s.name} ${displayValue}</li>`;
                            }).join('')}
                        </ul>
                    </div>
                `;
            })
            .join('');
    
        return `
            <html>
            <head>
                <title>Booking Details</title>
                <style>
                    @page { size: A4; margin: 0; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; color: #333; font-size: 10pt; }
                    .container { width: 210mm; height: 297mm; padding: 15mm; box-sizing: border-box; display: flex; flex-direction: column; }
                    .header { text-align: center; border-bottom: 2px solid #8b4513; padding-bottom: 10px; }
                    .header h1 { color: #8b4513; margin: 0; font-size: 20pt; }
                    .header p { margin: 2px 0 0; color: #666; font-size: 9pt; }
                    h2 { color: #8b4513; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 20px; font-size: 14pt; }
                    .details-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px; }
                    .grid-item { break-inside: avoid; }
                    .grid-item strong { display: block; color: #555; font-size: 8pt; margin-bottom: 2px; text-transform: uppercase; }
                    .financials { background-color: #f7f7f7; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin-top: 15px; }
                    .financials-grid { display: grid; grid-template-columns: ${finalDiscount > 0 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)'}; gap: 10px; text-align: center; }
                    .financial-item strong { font-size: 8pt; text-transform: uppercase; color: #555; }
                    .financial-item span { font-size: 11pt; font-weight: bold; display: block; margin-top: 4px; }
                    #balance span { color: #d9534f; }
                    .services-container { flex-grow: 1; }
                    .services-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                    .category { margin-bottom: 10px; break-inside: avoid; }
                    .category h3 { background-color: #f4f1eb; color: #8b4513; padding: 6px; border-radius: 4px; font-size: 10pt; }
                    .category ul { list-style: none; padding-left: 10px; margin: 5px 0 0; }
                    .category li { padding: 3px 0; border-bottom: 1px dashed #eee; font-size: 9pt; }
                    .footer { text-align: center; margin-top: auto; padding-top: 15px; border-top: 1px solid #ddd; font-size: 8pt; color: #888; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Heritage Grand</h1>
                        <p>Where Memories Are Made</p>
                        <p>+91 98765 43210 | info@heritagegrand.com</p>
                    </div>
                    <div class="details-grid" style="margin-top: 20px;">
                        <div class="grid-item"><strong>Client Name:</strong> ${clientName}</div>
                        <div class="grid-item"><strong>Event Date:</strong> ${new Date(eventDate).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</div>
                        <div class="grid-item"><strong>Event Type:</strong> ${eventType}</div>
                        <div class="grid-item"><strong>Expected Guests:</strong> ${guests}</div>
                        <div class="grid-item"><strong>Shift:</strong> ${shift}</div>
                    </div>
                    <div class="financials">
                        <div class="financials-grid">
                            <div class="financial-item"><strong>Total Rate</strong><span>₹${rate.toLocaleString('en-IN')}</span></div>
                            ${finalDiscount > 0 ? `<div class="financial-item"><strong>Discount</strong><span>- ₹${finalDiscount.toLocaleString('en-IN')}</span></div>` : ''}
                            <div class="financial-item"><strong>Advance Paid</strong><span>₹${advance.toLocaleString('en-IN')}</span></div>
                            <div class="financial-item" id="balance"><strong>Balance Due</strong><span>₹${balance.toLocaleString('en-IN')}</span></div>
                        </div>
                    </div>
                    <div class="services-container">
                        <h2>Included Services & Amenities</h2>
                        <div class="services-grid">
                            ${serviceHtml}
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is a computer-generated document and does not require a signature. Terms & Conditions apply.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handleDownloadProforma = () => {
        if (!formState.clientName || !formState.eventDate) {
            addToast("Please enter a Client Name and Event Date first.", "warning");
            return;
        }
        const html = generateProformaHtml();
        const filename = `${formState.eventDate}-${formState.clientName.replace(/ /g, '_')}`;
        printHtmlAsPDF(html, filename);
    };

    const renderServiceControl = (service: Service) => {
        const value = formState.services[service.id];
        switch (service.type) {
            case 'checkbox':
                return (
                    <div key={service.id} className={`service-item ${value ? 'active' : ''}`} onClick={() => handleServiceChange(service.id, !value)}>
                        <input type="checkbox" checked={!!value} readOnly className="service-checkbox" />
                        <label className="service-label">{service.name}</label>
                    </div>
                );
            case 'number':
                 return (
                    <div key={service.id} className={`service-item ${Number(value) > 0 ? 'active' : ''}`}>
                         <label className="service-label">{service.name}:</label>
                         <input
                            type="number"
                            min={service.min}
                            max={service.max}
                            value={value as number || 0}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleServiceChange(service.id, parseInt(e.target.value, 10))}
                            className="service-number"
                         />
                    </div>
                );
            case 'dropdown':
                return (
                     <div key={service.id} className={`service-item ${value && value !== 'None' && value !== (service.options && service.options[0]) ? 'active' : ''}`}>
                        <label className="service-label">{service.name}:</label>
                        <select
                            value={value as string || (service.options && service.options[0])}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleServiceChange(service.id, e.target.value)}
                            className="service-dropdown"
                        >
                            {service.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                );
            default:
                return null;
        }
    };
    
    const balance = formState.rate - (formState.discount || 0) - formState.advance;

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <h2 className="text-2xl font-bold text-[#8b4513]">{isEditMode ? `Edit Booking: ${bookingToEdit.clientName}` : 'Create New Booking'}</h2>

            <div className="p-4 sm:p-6 bg-white rounded-xl border-2 border-[#f0e6d2] shadow-lg space-y-8">
                {/* Details Section */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Row 1: ID, Date, Shift */}
                        <div className="form-group"><label>Booking ID</label><input type="text" value={bookingId} readOnly className="form-input bg-gray-100" /></div>
                        <div className="form-group"><label htmlFor="eventDate">Event Date *</label><input type="date" id="eventDate" name="eventDate" value={formState.eventDate} onChange={handleInputChange} required className="form-input" /></div>
                        <div className="form-group"><label htmlFor="shift">Shift *</label><select id="shift" name="shift" value={formState.shift} onChange={handleInputChange} required className="form-input"><option value="">Select Shift</option><option value="Day">Day</option><option value="Night">Night</option></select></div>

                        {/* Row 2: Client Info */}
                        <div className="form-group sm:col-span-2 lg:col-span-1"><label htmlFor="clientName">Client Name *</label><input type="text" id="clientName" name="clientName" value={formState.clientName} onChange={handleInputChange} required className="form-input" placeholder="Enter client name" /></div>
                        <div className="form-group"><label htmlFor="contact">Contact Number *</label><input type="tel" id="contact" name="contact" value={formState.contact} onChange={handleInputChange} required className="form-input" placeholder="10-digit mobile number" /></div>
                        <div className="form-group"><label htmlFor="eventType">Event Type</label><select id="eventType" name="eventType" value={formState.eventType} onChange={handleInputChange} className="form-input"><option value="">Select</option><option value="Wedding">Wedding</option><option value="Reception">Reception</option><option value="Corporate">Corporate</option><option value="Birthday">Birthday</option><option value="Other">Other</option></select></div>
                        
                        {/* Row 3: Guests, Package, Rate */}
                        <div className="form-group"><label htmlFor="guests">Expected Guests</label><input type="number" id="guests" name="guests" value={formState.guests} onChange={handleInputChange} className="form-input" min="1" /></div>
                        <div className="form-group"><label htmlFor="packageId">Select Package</label><select id="packageId" name="packageId" value={formState.packageId} onChange={handlePackageChange} className="form-input"><option value="">Custom / No Package</option>{packages.map(p => <option key={p.id} value={p.id}>{p.name} - ₹{p.price.toLocaleString('en-IN')}</option>)}</select></div>
                        <div className="form-group"><label htmlFor="rate">Total Rate (₹) *</label><input type="number" id="rate" name="rate" value={formState.rate} onChange={handleInputChange} required className="form-input" min="0" /></div>
                        
                        {/* Row 4: Discount, Advance, Payment Mode */}
                        <div className="form-group"><label htmlFor="discount">Discount (₹)</label><input type="number" id="discount" name="discount" value={formState.discount} onChange={handleInputChange} className="form-input" min="0" /></div>
                        <div className="form-group"><label htmlFor="advance">Initial Payment (₹) *</label><input type="number" id="advance" name="advance" value={formState.advance} onChange={handleInputChange} required className="form-input" min="0" disabled={isEditMode} title={isEditMode ? "Payments are managed in the 'View Details' modal" : ""} /></div>
                        
                        <div className="form-group">
                            <label htmlFor="initialPaymentMode">Payment Mode</label>
                            <select 
                                name="initialPaymentMode" 
                                value={formState.initialPaymentMode} 
                                onChange={handleInputChange} 
                                className="form-input"
                                disabled={isEditMode || formState.advance <= 0}
                            >
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank / Online</option>
                            </select>
                        </div>

                        {/* Row 5 (Conditional): Bank Details */}
                        {formState.initialPaymentMode === 'Bank' && formState.advance > 0 && !isEditMode && (
                            <>
                                <div className="form-group bg-blue-50 p-2 rounded border border-blue-200">
                                    <label htmlFor="initialPaymentMedium">Payment Medium</label>
                                    <select name="initialPaymentMedium" value={formState.initialPaymentMedium} onChange={handleInputChange} className="form-input mt-1">
                                        <option value="UPI">UPI</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Card">Card</option>
                                        <option value="Other">Other / Net Banking</option>
                                    </select>
                                </div>
                                <div className="form-group bg-blue-50 p-2 rounded border border-blue-200 sm:col-span-2">
                                    <label htmlFor="initialPaymentRef">Reference / Cheque No</label>
                                    <input type="text" name="initialPaymentRef" value={formState.initialPaymentRef} onChange={handleInputChange} className="form-input mt-1" placeholder="Enter UTR, Cheque No, or Transaction ID" />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-orange-100 p-4 rounded-xl border-2 border-yellow-200 mt-4">
                        <h4 className="text-md font-bold text-center text-[#8b4513] mb-3">Financial Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div><p className="text-xs text-gray-500">Total Rate</p><p className="text-lg font-bold text-gray-800">₹{formState.rate.toLocaleString('en-IN')}</p></div>
                             <div><p className="text-xs text-gray-500">Discount</p><p className="text-lg font-bold text-orange-600">₹{(formState.discount || 0).toLocaleString('en-IN')}</p></div>
                            <div><p className="text-xs text-gray-500">Paid</p><p className="text-lg font-bold text-green-600">₹{formState.advance.toLocaleString('en-IN')}</p></div>
                            <div><p className="text-xs text-gray-500">Balance Due</p><p className={`text-lg font-bold ${balance > 0 ? 'text-red-600' : 'text-gray-800'}`}>₹{balance.toLocaleString('en-IN')}</p></div>
                        </div>
                    </div>
                </div>

                {/* Services Section */}
                <div>
                    <h3 className="form-section-title">Services & Amenities</h3>
                    <div className="space-y-6">
                        {Object.entries(servicesConfig).map(([category, services]) => (
                            <div key={category}>
                                <div className={`service-category-header flex justify-between items-center ${SERVICE_CATEGORY_STYLES[category as ServiceCategory].bg} ${SERVICE_CATEGORY_STYLES[category as ServiceCategory].border} ${SERVICE_CATEGORY_STYLES[category as ServiceCategory].text}`}>
                                    <span>{SERVICE_CATEGORY_STYLES[category as ServiceCategory].icon} {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenServiceEditor(category as ServiceCategory)}
                                        className="text-lg font-bold hover:bg-white/30 rounded-full w-7 h-7 flex items-center justify-center transition"
                                        title="Add New Service"
                                    >
                                        ➕
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">{services.map(renderServiceControl)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-start gap-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <input
                    type="checkbox"
                    id="consentCheck"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-[#8b4513] focus:ring-[#cd853f] cursor-pointer"
                />
                <label htmlFor="consentCheck" className="text-sm text-gray-700 cursor-pointer">
                    I confirm that all the details entered are correct to the best of my knowledge. I have reviewed the package details, services, and financial summary with the client and have received their approval for this booking.
                </label>
            </div>
            
            <div className="pt-6 flex justify-end gap-4 flex-wrap">
                 <button type="button" onClick={handleDownloadProforma} className="btn-primary" disabled={!formState.clientName || !formState.eventDate}>📄 Download Proforma</button>
                 <button type="button" onClick={handleReset} className="btn-secondary">🔄 {isEditMode ? 'Cancel Edit' : 'Reset Form'}</button>
                 <button 
                    type="submit" 
                    className={`btn-success ${!consentChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!consentChecked}
                >
                    ✅ {isEditMode ? 'Update Booking' : 'Create Booking'}
                </button>
            </div>

            {isServiceEditorOpen && newServiceCategory && (
                <ServiceEditor
                    isOpen={isServiceEditorOpen}
                    onClose={() => setIsServiceEditorOpen(false)}
                    onSave={handleSaveNewService}
                    existingService={null}
                    category={newServiceCategory}
                    servicesConfig={servicesConfig}
                />
            )}

            <style>{`.form-section-title { font-size: 1.1rem; font-weight: bold; color: #8b4513; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #cd853f; } .form-group { display: flex; flex-direction: column; gap: 0.5rem; } .form-group label { font-weight: bold; color: #333; font-size: 0.85em; } .form-input { width: 100%; padding: 0.6rem 0.8rem; border: 2px solid #ddd; border-radius: 0.5rem; font-family: 'Lora', serif; font-size: 0.9em; background: white; transition: all 0.3s ease; } .form-input:focus { outline: none; border-color: #cd853f; box-shadow: 0 0 8px rgba(205, 133, 63, 0.3); background: #fffbf7; } .service-category-header { padding: 0.5rem; border-radius: 0.5rem; text-align: left; font-weight: bold; border-width: 2px; padding-left: 1rem; padding-right: 0.5rem;} .service-item { display: flex; align-items: center; gap: 0.75rem; background: #f8f9fa; padding: 0.6rem; border-radius: 0.5rem; border: 2px solid #dee2e6; transition: all 0.3s ease; cursor: pointer; } .service-item:hover { background: #f0f8ff; border-color: #cd853f; } .service-item.active { background: linear-gradient(135deg, #e8f5e8, #c8e6c9); border-color: #4caf50; } .service-checkbox { width: 1.1rem; height: 1.1rem; cursor: pointer; accent-color: #4caf50; } .service-label { flex: 1; font-weight: 500; color: #333; cursor: pointer; margin: 0; font-size: 0.9em; } .service-number { width: 80px; padding: 0.4rem 0.5rem; border: 2px solid #ddd; border-radius: 0.3rem; font-family: 'Lora', serif; font-size: 0.9em; text-align: center; background: white; transition: all 0.3s ease; } .service-dropdown { width: 160px; padding: 0.4rem 0.5rem; border: 2px solid #ddd; border-radius: 0.3rem; font-family: 'Lora', serif; font-size: 0.9em; text-align: left; background: white; transition: all 0.3s ease; } .service-number:focus, .service-dropdown:focus { outline: none; border-color: #cd853f; box-shadow: 0 0 5px rgba(205, 133, 63, 0.3); }`}</style>
        </form>
    );
};

export default NewBooking;
