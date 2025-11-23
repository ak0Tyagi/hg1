import React, { useState, useEffect } from 'react';
import { Package, Service, ServiceConfig } from '../../types';
import Modal from '../Modal';
import { SERVICE_CATEGORY_STYLES } from '../../constants';

interface PackageEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (pkg: Package) => void;
    existingPackage: Package | null;
    servicesConfig: ServiceConfig;
}

const PackageEditor: React.FC<PackageEditorProps> = ({ isOpen, onClose, onSave, existingPackage, servicesConfig }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [services, setServices] = useState<Record<string, boolean | string | number>>({});

    useEffect(() => {
        if (existingPackage) {
            setName(existingPackage.name);
            setPrice(existingPackage.price);
            setServices(existingPackage.services);
        } else {
            setName('');
            setPrice(0);
            setServices({});
        }
    }, [existingPackage, isOpen]);

    const handleServiceChange = (id: string, value: any) => {
        setServices(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = () => {
        if (!name || price <= 0) {
            // Basic validation
            alert('Please provide a valid name and price.');
            return;
        }
        onSave({
            id: existingPackage?.id || `pkg-${Date.now()}`,
            name,
            price,
            services,
        });
    };

    const renderServiceControl = (service: Service) => {
        const value = services[service.id];
        switch (service.type) {
            case 'checkbox':
                return (
                     <div key={service.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
                        <input id={`pkg-svc-${service.id}`} type="checkbox" checked={!!value} onChange={(e) => handleServiceChange(service.id, e.target.checked)} className="h-4 w-4 accent-[#4caf50]" />
                        <label htmlFor={`pkg-svc-${service.id}`} className="flex-1 cursor-pointer">{service.name}</label>
                    </div>
                );
            case 'number':
                return (
                    <div key={service.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
                        <label className="flex-1">{service.name}:</label>
                        <input type="number" value={value as number || 0} onChange={(e) => handleServiceChange(service.id, parseInt(e.target.value, 10))} className="w-20 text-center border border-gray-300 rounded-md p-1" />
                    </div>
                );
            case 'dropdown':
                return (
                    <div key={service.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
                        <label className="flex-1">{service.name}:</label>
                         <select value={value as string || ''} onChange={(e) => handleServiceChange(service.id, e.target.value)} className="flex-1 border border-gray-300 rounded-md p-1">
                            {service.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                );
        }
    };

    return (
        <Modal
            title={existingPackage ? 'Edit Package' : 'Create Package'}
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-success" onClick={handleSave}>💾 Save Package</button></>}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="font-bold text-sm">Package Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="font-bold text-sm">Package Price (₹)</label>
                        <input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} className="w-full mt-1 p-2 border border-gray-300 rounded-md" />
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-lg mt-4 mb-2">Included Services</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-h-96 overflow-y-auto p-2 border rounded-lg">
                        {Object.entries(servicesConfig).map(([category, serviceList]) => (
                            <div key={category}>
                                <h5 className={`font-bold text-md capitalize p-2 rounded-md ${SERVICE_CATEGORY_STYLES[category].bg} ${SERVICE_CATEGORY_STYLES[category].text}`}>{SERVICE_CATEGORY_STYLES[category].icon} {category.replace('-', ' ')}</h5>
                                <div className="mt-2 space-y-1 text-sm">
                                    {serviceList.map(renderServiceControl)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PackageEditor;
