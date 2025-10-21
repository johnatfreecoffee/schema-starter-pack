-- Create templates for existing services without template_id
WITH service_templates AS (
  SELECT 
    s.id as service_id,
    s.name as service_name,
    s.slug as service_slug
  FROM services s
  WHERE s.template_id IS NULL
),
inserted_templates AS (
  INSERT INTO templates (name, template_type, template_html)
  SELECT 
    service_name || ' Template' as name,
    'service' as template_type,
    '<div class="service-page">
  <section class="hero">
    <h1>' || service_name || ' in {{city_name}}, LA</h1>
    <p class="lead">Professional ' || service_name || ' services in {{city_name}}. {{company_name}} has been serving {{display_name}} with quality and reliability.</p>
    <div class="cta-buttons">
      <a href="tel:{{company_phone}}" class="btn btn-primary">Call {{company_phone}}</a>
      <a href="/contact" class="btn btn-secondary">Get Free Quote</a>
    </div>
  </section>

  <section class="service-details">
    <h2>About Our ' || service_name || ' Service</h2>
    <p>{{service_description}}</p>
  </section>

  <section class="local-info">
    <h2>' || service_name || ' in {{city_name}}</h2>
    <p>{{local_description}}</p>
    
    {{#if local_benefits}}
    <h3>Why Choose Us in {{city_name}}?</h3>
    <ul class="benefits">
      {{#each local_benefits}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
    {{/if}}
    
    {{#if response_time}}
    <div class="service-stats">
      <p><strong>Average Response Time:</strong> {{response_time}}</p>
      {{#if completion_time}}<p><strong>Typical Completion:</strong> {{completion_time}}</p>{{/if}}
      {{#if customer_count}}<p><strong>Customers Served in {{city_name}}:</strong> {{customer_count}}+</p>{{/if}}
    </div>
    {{/if}}
  </section>

  {{#if service_starting_price}}
  <section class="pricing">
    <h2>' || service_name || ' Pricing in {{city_name}}</h2>
    {{#if pricing_notes}}<p>{{pricing_notes}}</p>{{/if}}
    <p class="starting-price">Starting at {{service_starting_price}}</p>
  </section>
  {{/if}}

  <section class="cta-bottom">
    <h2>Ready to Get Started?</h2>
    <p>Contact {{company_name}} today for professional ' || service_name || ' in {{city_name}}.</p>
    <div class="contact-info">
      <a href="tel:{{company_phone}}" class="phone-link">📞 {{company_phone}}</a>
      <a href="mailto:{{company_email}}" class="email-link">✉️ {{company_email}}</a>
    </div>
  </section>
</div>' as template_html
  FROM service_templates
  RETURNING id, name
)
SELECT * FROM inserted_templates;

-- Update services to link to their new templates
UPDATE services s
SET template_id = t.id
FROM templates t
WHERE t.name = s.name || ' Template'
  AND s.template_id IS NULL;