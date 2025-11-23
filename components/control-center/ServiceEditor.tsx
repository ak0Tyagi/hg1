import React, { useState, useEffect } from 'react';
// FIX: Aliased ServiceUIType to ServiceCategory to resolve the missing export.
import { Service, ServiceConfig, ServiceUIType as ServiceCategory } from '../../types';
import Modal from '../Modal';

interface ServiceEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: ServiceCategory, service: Service) => void;
    existingService: { category: ServiceCategory; service: Service } | null;
    category: ServiceCategory;
    servicesConfig: ServiceConfig;
}

const ServiceEditor: React.FC<ServiceEditorProps> = ({ isOpen, onClose, onSave, existingService, category, servicesConfig }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<Service['type']>('checkbox');
    const [options, setOptions] = useState<string[]>(['']);
    const [min, setMin] = useState(0);
    const [max, setMax] = useState(10);

    useEffect(() => {
        if (existingService) {
            const { service } = existingService;
            setName(service.name);
            setType(service.type);
            if (service.type === 'dropdown') setOptions(service.options || ['']);
            if (service.type === 'number') {
                setMin(service.min || 0);
                setMax(service.max || 10);
            }
        } else {
            setName('');
            setType('checkbox');
            setOptions(['']);
            setMin(0);
            setMax(10);
        }
    }, [existingService, isOpen]);
    
    const handleAddOption = () => setOptions([...options, '']);
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };
    const handleRemoveOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        const serviceId = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        if (servicesConfig[category].some(s => s.id === serviceId && s.id !== existingService?.service.id)) {
            alert('A service with this name already exists in this category.');
            return;
        }

        const serviceData: Service = {
            id: existingService?.service.id || serviceId,
            name,
            type,
        };

        if (type === 'dropdown') {
            serviceData.options = options.filter(opt => opt.trim() !== '');
            if (serviceData.options.length === 0) {
                 alert('Please add at least one valid option for the dropdown.');
                 return;
            }
        }
        if (type === 'number') {
            serviceData.min = min;
            serviceData.max = max;
        }

        onSave(category, serviceData);
    };

    return (
        <Modal
            title={existingService ? 'Edit Service' : 'Create Service'}
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-success" onClick={handleSave}>💾 Save Service</button></>}
        >
            <div className="space-y-4">
                <div>
                    <label className="font-bold text-sm">Service Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label className="font-bold text-sm">Service Type</label>
                    <div className="flex gap-2 mt-1">
                        {(['checkbox', 'dropdown', 'number'] as const).map(t => (
                            <button key={t} onClick={() => setType(t)} className={`px-4 py-2 rounded-md text-sm font-bold border-2 ${type === t ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 border-gray-300'}`}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {type === 'dropdown' && (
                    <div className="p-3 border rounded-md bg-gray-50 space-y-2">
                        <label className="font-bold text-sm">Dropdown Options</label>
                        {options.map((opt, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input type="text" value={opt} onChange={e => handleOptionChange(index, e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-md" placeholder={`Option ${index + 1}`} />
                                <button onClick={() => handleRemoveOption(index)} className="btn-danger !p-2 leading-none">🗑️</button>
                            </div>
                        ))}
                        <button onClick={handleAddOption} className="btn-success text-sm !py-1">➕ Add Option</button>
                    </div>
                )}

                {type === 'number' && (
                    <div className="p-3 border rounded-md bg-gray-50 grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-bold text-sm">Min Value</label>
                            <input type="number" value={min} onChange={e => setMin(parseInt(e.target.value))} className="w-full mt-1 p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="font-bold text-sm">Max Value</label>
                            <input type="number" value={max} onChange={e => setMax(parseInt(e.target.value))} className="w-full mt-1 p-2 border border-gray-300 rounded-md" />
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ServiceEditor;