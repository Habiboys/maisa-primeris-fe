import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Department } from '../services/department.service';
import { departmentService } from '../services/department.service';
import type { Material } from '../services/material.service';
import { materialService } from '../services/material.service';
import type { PaymentScheme } from '../services/paymentScheme.service';
import { paymentSchemeService } from '../services/paymentScheme.service';
import { getErrorMessage } from '../lib/utils';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return { departments, isLoading, refetch: fetchDepartments };
}

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await materialService.getAll();
      setMaterials(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  return { materials, isLoading, refetch: fetchMaterials };
}

export function usePaymentSchemes() {
  const [paymentSchemes, setPaymentSchemes] = useState<PaymentScheme[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPaymentSchemes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await paymentSchemeService.getAll();
      setPaymentSchemes(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentSchemes();
  }, [fetchPaymentSchemes]);

  return { paymentSchemes, isLoading, refetch: fetchPaymentSchemes };
}

