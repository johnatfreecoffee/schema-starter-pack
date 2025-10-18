import { useCompanySettings } from '@/hooks/useCompanySettings';

const AboutUs = () => {
  const { data: company } = useCompanySettings();

  return (
    <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">About Us</h1>
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-lg">
            {company?.description || 'Learn more about our company and mission.'}
          </p>
          {company?.years_experience && (
            <div className="bg-primary/10 p-6 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {company.years_experience}+ Years of Experience
              </p>
            </div>
          )}
        </div>
      </div>
  );
};

export default AboutUs;
