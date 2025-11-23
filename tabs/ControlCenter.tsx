import React, { useState, useEffect } from 'react';
import { Package, Service, ServiceConfig, ServiceUIType as ServiceCategory, ExpenseCategory, Vendor } from '../types';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { SERVICE_CATEGORY_STYLES } from '../constants';
import PackageEditor from '../components/control-center/PackageEditor';
import ServiceEditor from '../components/control-center/ServiceEditor';


interface ControlCenterProps {
    packages: Package[];
    setPackages: React.Dispatch<React.SetStateAction<Package[]>>;
    servicesConfig: ServiceConfig;
    setServicesConfig: React.Dispatch<React.SetStateAction<ServiceConfig>>;
    expenseCategories: ExpenseCategory[];
    setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
    vendors: Vendor[];
    setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
    addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

// Reusable editor modal for simple name-based items (Category, Vendor)
const ItemEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: any) => void;
    item: any | null;
    title: string;
    fields: { name: string; label: string; type: string; options?: { value: string; label: string }[] }[];
}> = ({ isOpen, onClose, onSave, item, title, fields }) => {
    const [state, setState] = useState<any>({});

    useEffect(() => {
        if (isOpen) {
            if (item) {
                setState(item);
            } else {
                const initialState: any = {};
                fields.forEach(f => {
                    if (f.type === 'checkbox') {
                        initialState[f.name] = false;
                    } else if (f.type === 'select') {
                        initialState[f.name] = item?.[f.name] || '';
                    } else {
                        initialState[f.name] = '';
                    }
                });
                setState(initialState);
            }
        }
    }, [item, isOpen, fields]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setState((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = () => {
        if (!state.name) {
            alert('Name is required.');
            return;
        }
        if (fields.some(f => f.type === 'select' && !state[f.name])) {
            alert('Please select a category.');
            return;
        }
        onSave({ ...item, ...state, id: item?.id || `${state.name.toLowerCase().replace(/ /g, '-')}-${Date.now()}` });
    };

    return (
        <Modal title={title} isOpen={isOpen} onClose={onClose} footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-success" onClick={handleSave}>Save</button></>}>
            <div className="space-y-4">
                {fields.map(field => (
                    <div key={field.name}>
                        <label className="font-bold text-sm">{field.label}</label>
                        {field.type === 'checkbox' ? (
                            <div className="mt-1 flex items-center">
                                <input id={field.name} name={field.name} type="checkbox" checked={state[field.name] || false} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <label htmlFor={field.name} className="ml-2 block text-sm text-gray-700">Enable this option</label>
                            </div>
                        ) : field.type === 'select' ? (
                            <select name={field.name} value={state[field.name] || ''} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                                <option value="">-- Select --</option>
                                {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        ) : (
                            <input name={field.name} type={field.type} value={state[field.name] || ''} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md" />
                        )}
                    </div>
                ))}
            </div>
        </Modal>
    );
};


const ControlCenter: React.FC<ControlCenterProps> = ({ packages, setPackages, servicesConfig, setServicesConfig, expenseCategories, setExpenseCategories, vendors, setVendors, addToast }) => {
    const [isPackageModalOpen, setPackageModalOpen] = useState(false);
    const [isServiceModalOpen, setServiceModalOpen] = useState(false);
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [isVendorModalOpen, setVendorModalOpen] = useState(false);

    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [editingService, setEditingService] = useState<{ category: ServiceCategory; service: Service } | null>(null);
    const [serviceCategoryToEdit, setServiceCategoryToEdit] = useState<ServiceCategory | null>(null);
    const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | null>(null);

    const [itemToDelete, setItemToDelete] = useState<{ type: 'package' | 'service' | 'category' | 'vendor'; data: any } | null>(null);

    // Handlers for Categories and Vendors
    const openCategoryEditor = (cat: ExpenseCategory | null) => { setEditingCategory(cat); setCategoryModalOpen(true); };
    const openVendorEditor = (v: Vendor | null, categoryId?: string) => { 
        setEditingVendor(v); 
        // If adding a new vendor, pre-select its category
        if (!v && categoryId) {
            setEditingVendor({id: '', name: '', categoryId: categoryId});
        }
        setVendorModalOpen(true);
     };

    const handleSaveCategory = (cat: ExpenseCategory) => {
        if (editingCategory) {
            setExpenseCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
            addToast(`Category "${cat.name}" updated.`, 'success');
        } else {
            setExpenseCategories(prev => [...prev, cat]);
            addToast(`Category "${cat.name}" created.`, 'success');
        }
        setCategoryModalOpen(false);
    };

    const handleSaveVendor = (v: Vendor) => {
        if (editingVendor && vendors.some(vendor => vendor.id === v.id)) {
            setVendors(prev => prev.map(vendor => vendor.id === v.id ? v : vendor));
            addToast(`Vendor "${v.name}" updated.`, 'success');
        } else {
            setVendors(prev => [...prev, v]);
            addToast(`Vendor "${v.name}" created.`, 'success');
        }
        setVendorModalOpen(false);
    };


    // Package Handlers
    const openPackageEditor = (pkg: Package | null = null) => {
        setEditingPackage(pkg);
        setPackageModalOpen(true);
    };

    const handleSavePackage = (pkg: Package) => {
        if (editingPackage) {
            setPackages(prev => prev.map(p => p.id === pkg.id ? pkg : p));
            addToast(`Package "${pkg.name}" updated successfully!`, 'success');
        } else {
            setPackages(prev => [...prev, pkg]);
            addToast(`Package "${pkg.name}" created successfully!`, 'success');
        }
        setPackageModalOpen(false);
    };

    // Service Handlers
    const openServiceEditor = (category: ServiceCategory, service: Service | null = null) => {
        setEditingService(service ? { category, service } : null);
        setServiceCategoryToEdit(category);
        setServiceModalOpen(true);
    };
    
    const handleSaveService = (category: ServiceCategory, service: Service) => {
        setServicesConfig(prev => {
            const newConfig = { ...prev };
            const categoryServices = [...newConfig[category]];
            if (editingService) {
                const index = categoryServices.findIndex(s => s.id === service.id);
                if (index > -1) categoryServices[index] = service;
            } else {
                categoryServices.push(service);
            }
            newConfig[category] = categoryServices;
            return newConfig;
        });
        addToast(`Service "${service.name}" saved successfully!`, 'success');
        setServiceModalOpen(false);
    };

    // Deletion Handlers
    const confirmDeletion = () => {
        if (!itemToDelete) return;
        const { type, data } = itemToDelete;
        let name = '';
        if (type === 'package') {
            setPackages(prev => prev.filter(p => p.id !== data.id));
            name = data.name;
        } else if (type === 'service') {
            setServicesConfig(prev => {
                const newConfig = { ...prev };
                newConfig[data.category] = newConfig[data.category].filter(s => s.id !== data.service.id);
                return newConfig;
            });
            name = data.service.name;
        } else if (type === 'category') {
            setExpenseCategories(prev => prev.filter(c => c.id !== data.id));
            setVendors(prev => prev.filter(v => v.categoryId !== data.id)); // Also remove associated vendors
            name = data.name;
        } else if (type === 'vendor') {
            setVendors(prev => prev.filter(v => v.id !== data.id));
            name = data.name;
        }
        addToast(`${type.charAt(0).toUpperCase() + type.slice(1)} "${name}" deleted.`, 'warning');
        setItemToDelete(null);
    };


    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-[#8b4513]">Control Center</h2>

            {/* Package Management */}
            <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h3 className="text-xl font-bold text-purple-800">📦 Package Management</h3>
                    <button onClick={() => openPackageEditor(null)} className="btn-success">➕ Create Package</button>
                </div>
                <div className="space-y-3">
                    {packages.map(pkg => (
                        <div key={pkg.id} className="bg-white p-3 rounded-lg flex justify-between items-center shadow-sm flex-wrap gap-2">
                            <div>
                                <p className="font-bold text-purple-900">{pkg.name}</p>
                                <p className="text-sm text-gray-600">₹{pkg.price.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openPackageEditor(pkg)} className="btn-warning !px-3 !py-1.5">✏️ Edit</button>
                                <button onClick={() => setItemToDelete({type: 'package', data: pkg})} className="btn-danger !px-3 !py-1.5">🗑️ Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Services Management */}
            <div className="p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
                 <h3 className="text-xl font-bold text-orange-800 mb-4">🎪 Services & Amenities</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(servicesConfig).map(([category, services]) => (
                        <div key={category} className={`p-4 rounded-lg border-2 ${SERVICE_CATEGORY_STYLES[category].border} ${SERVICE_CATEGORY_STYLES[category].bg}`}>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className={`font-bold capitalize ${SERVICE_CATEGORY_STYLES[category].text}`}>{SERVICE_CATEGORY_STYLES[category].icon} {category.replace('-', ' ')}</h4>
                                <button onClick={() => openServiceEditor(category as ServiceCategory)} className="text-sm btn-success !p-2 leading-none">➕</button>
                            </div>
                            <div className="space-y-2">
                                {services.map(service => (
                                    <div key={service.id} className="bg-white/70 p-2 rounded-md text-sm flex justify-between items-center gap-2">
                                        <span className="font-medium">{service.name} <span className="text-xs text-gray-500">({service.type})</span></span>
                                        <div className="flex gap-1.5">
                                            <button onClick={() => openServiceEditor(category as ServiceCategory, service)} className="text-xs btn-warning !p-1.5 leading-none">✏️</button>
                                            <button onClick={() => setItemToDelete({type: 'service', data: {category, service}})} className="text-xs btn-danger !p-1.5 leading-none">🗑️</button>
                                        </div>
                                    </div>
                                ))}
                                {services.length === 0 && <p className="text-xs text-center text-gray-500 py-2">No services in this category.</p>}
                            </div>
                        </div>
                    ))}
                 </div>
            </div>

             {/* Expense Settings */}
            <div className="p-6 bg-teal-50 rounded-xl border-2 border-teal-200">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h3 className="text-xl font-bold text-teal-800">💰 Expense Settings</h3>
                     <button onClick={() => openCategoryEditor(null)} className="btn-success !py-1.5 !px-3 text-sm">➕ New Category</button>
                </div>
                <div className="space-y-4">
                    {expenseCategories.map(cat => (
                        <div key={cat.id} className="p-4 rounded-lg bg-white border-2">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-teal-700">{cat.name} {cat.requiresManpower && <span className="text-xs text-blue-500 font-bold">(Requires Manpower)</span>}</h4>
                                <div className="flex gap-2">
                                    <button onClick={() => openCategoryEditor(cat)} className="text-xs btn-warning !p-1.5 leading-none">✏️</button>
                                    <button onClick={() => setItemToDelete({type: 'category', data: cat})} className="text-xs btn-danger !p-1.5 leading-none">🗑️</button>
                                </div>
                            </div>
                            <div className="pl-4 border-l-2 border-teal-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-sm text-gray-600">Vendors</h5>
                                    <button onClick={() => openVendorEditor(null, cat.id)} className="btn-success !py-1 !px-2 text-xs">➕ Add Vendor</button>
                                </div>
                                <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                                    {vendors.filter(v => v.categoryId === cat.id).map(v => (
                                        <div key={v.id} className="p-1.5 rounded-md flex justify-between items-center hover:bg-gray-50 text-sm">
                                            <span>{v.name}</span>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => openVendorEditor(v)} className="text-xs btn-warning !p-1 leading-none">✏️</button>
                                                <button onClick={() => setItemToDelete({type: 'vendor', data: v})} className="text-xs btn-danger !p-1 leading-none">🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                    {vendors.filter(v => v.categoryId === cat.id).length === 0 && (
                                        <p className="text-xs text-center text-gray-500 py-2">No vendors in this category.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Modals */}
            {isPackageModalOpen && (
                <PackageEditor
                    isOpen={isPackageModalOpen}
                    onClose={() => setPackageModalOpen(false)}
                    onSave={handleSavePackage}
                    existingPackage={editingPackage}
                    servicesConfig={servicesConfig}
                />
            )}
            
            {isServiceModalOpen && (
                 <ServiceEditor
                    isOpen={isServiceModalOpen}
                    onClose={() => setServiceModalOpen(false)}
                    onSave={handleSaveService}
                    existingService={editingService}
                    category={serviceCategoryToEdit!}
                    servicesConfig={servicesConfig}
                 />
            )}
            
            <ItemEditorModal 
                isOpen={isCategoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                onSave={handleSaveCategory}
                item={editingCategory}
                title={editingCategory ? "Edit Expense Category" : "Add Expense Category"}
                fields={[
                    { name: 'name', label: 'Category Name', type: 'text' },
                    { name: 'requiresManpower', label: 'Requires Manpower Calculation', type: 'checkbox' }
                ]}
            />
            
            <ItemEditorModal 
                isOpen={isVendorModalOpen}
                onClose={() => setVendorModalOpen(false)}
                onSave={handleSaveVendor}
                item={editingVendor}
                title={editingVendor?.id ? "Edit Vendor" : "Add Vendor"}
                fields={[
                    { name: 'name', label: 'Vendor Name', type: 'text' },
                    { 
                        name: 'categoryId',
                        label: 'Category',
                        type: 'select',
                        options: expenseCategories.map(c => ({ value: c.id, label: c.name }))
                    }
                ]}
            />
            
            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDeletion}
                title={`Confirm Deletion`}
            >
               Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </ConfirmationModal>

        </div>
    );
};

export default ControlCenter;