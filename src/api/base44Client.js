export const base44 = {
  entities: {
    BookingSlot: {
      list: async () => {
        const res = await fetch('/api/slots');
        return res.json();
      },
      create: async (data) => {
        const res = await fetch('/api/slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },
      update: async (id, data) => {
        const res = await fetch(`/api/slots/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },
      delete: async (id) => {
        const res = await fetch(`/api/slots/${id}`, { method: 'DELETE' });
        return res.json();
      }
    },
    AppSettings: {
      list: async () => {
        const res = await fetch('/api/settings');
        const data = await res.json();
        return [data];
      },
      create: async (data) => {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return res.json();
      },
      update: async (id, data) => {
         return base44.entities.AppSettings.create(data);
      }
    }
  }
};
