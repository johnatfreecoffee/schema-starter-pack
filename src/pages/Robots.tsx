import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Robots = () => {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRobots = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('robots', {
          method: 'GET'
        });

        if (error) {
          console.error('Error fetching robots.txt:', error);
          setText('User-agent: *\nAllow: /');
        } else {
          // Data from edge function should be the raw text string
          setText(data);
        }
      } catch (err) {
        console.error('Error:', err);
        setText('User-agent: *\nAllow: /');
      } finally {
        setLoading(false);
      }
    };

    fetchRobots();
  }, []);

  useEffect(() => {
    if (!loading && text) {
      // Set proper content type
      document.querySelector('meta[http-equiv="Content-Type"]')?.remove();
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Type';
      meta.content = 'text/plain; charset=utf-8';
      document.head.appendChild(meta);
    }
  }, [loading, text]);

  if (loading) {
    return <div>Loading robots.txt...</div>;
  }

  return (
    <pre style={{ 
      fontFamily: 'monospace', 
      fontSize: '14px',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      padding: '20px'
    }}>
      {text}
    </pre>
  );
};

export default Robots;
