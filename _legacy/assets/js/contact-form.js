 (function() {
      const xaiGamifiedFormSteps = [
        {
          id: 'name',
          title: 'Tell us your name',
          subtitle: 'How should we address you?',
          icon: 'user',
          placeholder: 'Your awesome name',
          required: true
        },
        {
          id: 'phone',
          title: 'Your phone number',
          subtitle: 'So we can reach you quickly',
          icon: 'phone',
          placeholder: '07726453677',
          required: true,
          isPhoneInput: true
        },
        {
          id: 'email',
          title: 'Email address',
          subtitle: 'For important updates',
          icon: 'mail',
          placeholder: 'you@awesome.com',
          required: true
        },
        {
          id: 'subject',
          title: 'What\'s this about?',
          subtitle: 'Give us a quick subject line',
          icon: 'message-square',
          placeholder: 'Your message subject',
          required: true
        },
        {
          id: 'message',
          title: 'Your message',
          subtitle: 'Tell us everything we need to know',
          icon: 'send',
          placeholder: 'Write your message here...',
          required: true,
          isTextarea: true
        }
      ];

      const xaiGamifiedFormCountryCodes = [
        { code: 'AD', dial: '+376', name: 'Andorra' },
        { code: 'AE', dial: '+971', name: 'United Arab Emirates' },
        { code: 'AF', dial: '+93', name: 'Afghanistan' },
        { code: 'AG', dial: '+1-268', name: 'Antigua and Barbuda' },
        { code: 'AI', dial: '+1-264', name: 'Anguilla' },
        { code: 'AL', dial: '+355', name: 'Albania' },
        { code: 'AM', dial: '+374', name: 'Armenia' },
        { code: 'AO', dial: '+244', name: 'Angola' },
        { code: 'AQ', dial: '+672', name: 'Antarctica' },
        { code: 'AR', dial: '+54', name: 'Argentina' },
        { code: 'AS', dial: '+1-684', name: 'American Samoa' },
        { code: 'AT', dial: '+43', name: 'Austria' },
        { code: 'AU', dial: '+61', name: 'Australia' },
        { code: 'AW', dial: '+297', name: 'Aruba' },
        { code: 'AX', dial: '+358', name: 'Aland Islands' },
        { code: 'AZ', dial: '+994', name: 'Azerbaijan' },
        { code: 'BA', dial: '+387', name: 'Bosnia and Herzegovina' },
        { code: 'BB', dial: '+1-246', name: 'Barbados' },
        { code: 'BD', dial: '+880', name: 'Bangladesh' },
        { code: 'BE', dial: '+32', name: 'Belgium' },
        { code: 'BF', dial: '+226', name: 'Burkina Faso' },
        { code: 'BG', dial: '+359', name: 'Bulgaria' },
        { code: 'BH', dial: '+973', name: 'Bahrain' },
        { code: 'BI', dial: '+257', name: 'Burundi' },
        { code: 'BJ', dial: '+229', name: 'Benin' },
        { code: 'BL', dial: '+590', name: 'Saint Barthelemy' },
        { code: 'BM', dial: '+1-441', name: 'Bermuda' },
        { code: 'BN', dial: '+673', name: 'Brunei' },
        { code: 'BO', dial: '+591', name: 'Bolivia' },
        { code: 'BQ', dial: '+599', name: 'Bonaire, Sint Eustatius and Saba' },
        { code: 'BR', dial: '+55', name: 'Brazil' },
        { code: 'BS', dial: '+1-242', name: 'Bahamas' },
        { code: 'BT', dial: '+975', name: 'Bhutan' },
        { code: 'BV', dial: '+47', name: 'Bouvet Island' },
        { code: 'BW', dial: '+267', name: 'Botswana' },
        { code: 'BY', dial: '+375', name: 'Belarus' },
        { code: 'BZ', dial: '+501', name: 'Belize' },
        { code: 'CA', dial: '+1', name: 'Canada' },
        { code: 'CC', dial: '+61', name: 'Cocos Islands' },
        { code: 'CD', dial: '+243', name: 'DR Congo' },
        { code: 'CF', dial: '+236', name: 'Central African Republic' },
        { code: 'CG', dial: '+242', name: 'Congo' },
        { code: 'CH', dial: '+41', name: 'Switzerland' },
        { code: 'CI', dial: '+225', name: 'Ivory Coast' },
        { code: 'CK', dial: '+682', name: 'Cook Islands' },
        { code: 'CL', dial: '+56', name: 'Chile' },
        { code: 'CM', dial: '+237', name: 'Cameroon' },
        { code: 'CN', dial: '+86', name: 'China' },
        { code: 'CO', dial: '+57', name: 'Colombia' },
        { code: 'CR', dial: '+506', name: 'Costa Rica' },
        { code: 'CU', dial: '+53', name: 'Cuba' },
        { code: 'CV', dial: '+238', name: 'Cape Verde' },
        { code: 'CW', dial: '+599', name: 'Curacao' },
        { code: 'CX', dial: '+61', name: 'Christmas Island' },
        { code: 'CY', dial: '+357', name: 'Cyprus' },
        { code: 'CZ', dial: '+420', name: 'Czech Republic' },
        { code: 'DE', dial: '+49', name: 'Germany' },
        { code: 'DJ', dial: '+253', name: 'Djibouti' },
        { code: 'DK', dial: '+45', name: 'Denmark' },
        { code: 'DM', dial: '+1-767', name: 'Dominica' },
        { code: 'DO', dial: '+1-809', name: 'Dominican Republic' },
        { code: 'DZ', dial: '+213', name: 'Algeria' },
        { code: 'EC', dial: '+593', name: 'Ecuador' },
        { code: 'EE', dial: '+372', name: 'Estonia' },
        { code: 'EG', dial: '+20', name: 'Egypt' },
        { code: 'EH', dial: '+212', name: 'Western Sahara' },
        { code: 'ER', dial: '+291', name: 'Eritrea' },
        { code: 'ES', dial: '+34', name: 'Spain' },
        { code: 'ET', dial: '+251', name: 'Ethiopia' },
        { code: 'FI', dial: '+358', name: 'Finland' },
        { code: 'FJ', dial: '+679', name: 'Fiji' },
        { code: 'FK', dial: '+500', name: 'Falkland Islands' },
        { code: 'FM', dial: '+691', name: 'Micronesia' },
        { code: 'FO', dial: '+298', name: 'Faroe Islands' },
        { code: 'FR', dial: '+33', name: 'France' },
        { code: 'GA', dial: '+241', name: 'Gabon' },
        { code: 'GB', dial: '+44', name: 'United Kingdom' },
        { code: 'GD', dial: '+1-473', name: 'Grenada' },
        { code: 'GE', dial: '+995', name: 'Georgia' },
        { code: 'GF', dial: '+594', name: 'French Guiana' },
        { code: 'GG', dial: '+44', name: 'Guernsey' },
        { code: 'GH', dial: '+233', name: 'Ghana' },
        { code: 'GI', dial: '+350', name: 'Gibraltar' },
        { code: 'GL', dial: '+299', name: 'Greenland' },
        { code: 'GM', dial: '+220', name: 'Gambia' },
        { code: 'GN', dial: '+224', name: 'Guinea' },
        { code: 'GP', dial: '+590', name: 'Guadeloupe' },
        { code: 'GQ', dial: '+240', name: 'Equatorial Guinea' },
        { code: 'GR', dial: '+30', name: 'Greece' },
        { code: 'GS', dial: '+500', name: 'South Georgia and the South Sandwich Islands' },
        { code: 'GT', dial: '+502', name: 'Guatemala' },
        { code: 'GU', dial: '+1-671', name: 'Guam' },
        { code: 'GW', dial: '+245', name: 'Guinea-Bissau' },
        { code: 'GY', dial: '+592', name: 'Guyana' },
        { code: 'HK', dial: '+852', name: 'Hong Kong' },
        { code: 'HM', dial: '+672', name: 'Heard Island and McDonald Islands' },
        { code: 'HN', dial: '+504', name: 'Honduras' },
        { code: 'HR', dial: '+385', name: 'Croatia' },
        { code: 'HT', dial: '+509', name: 'Haiti' },
        { code: 'HU', dial: '+36', name: 'Hungary' },
        { code: 'ID', dial: '+62', name: 'Indonesia' },
        { code: 'IE', dial: '+353', name: 'Ireland' },
        { code: 'IL', dial: '+972', name: 'Israel' },
        { code: 'IM', dial: '+44', name: 'Isle of Man' },
        { code: 'IN', dial: '+91', name: 'India' },
        { code: 'IO', dial: '+246', name: 'British Indian Ocean Territory' },
        { code: 'IQ', dial: '+964', name: 'Iraq' },
        { code: 'IR', dial: '+98', name: 'Iran' },
        { code: 'IS', dial: '+354', name: 'Iceland' },
        { code: 'IT', dial: '+39', name: 'Italy' },
        { code: 'JE', dial: '+44', name: 'Jersey' },
        { code: 'JM', dial: '+1-876', name: 'Jamaica' },
        { code: 'JO', dial: '+962', name: 'Jordan' },
        { code: 'JP', dial: '+81', name: 'Japan' },
        { code: 'KE', dial: '+254', name: 'Kenya' },
        { code: 'KG', dial: '+996', name: 'Kyrgyzstan' },
        { code: 'KH', dial: '+855', name: 'Cambodia' },
        { code: 'KI', dial: '+686', name: 'Kiribati' },
        { code: 'KM', dial: '+269', name: 'Comoros' },
        { code: 'KN', dial: '+1-869', name: 'Saint Kitts and Nevis' },
        { code: 'KP', dial: '+850', name: 'North Korea' },
        { code: 'KR', dial: '+82', name: 'South Korea' },
        { code: 'KW', dial: '+965', name: 'Kuwait' },
        { code: 'KY', dial: '+1-345', name: 'Cayman Islands' },
        { code: 'KZ', dial: '+7', name: 'Kazakhstan' },
        { code: 'LA', dial: '+856', name: 'Laos' },
        { code: 'LB', dial: '+961', name: 'Lebanon' },
        { code: 'LC', dial: '+1-758', name: 'Saint Lucia' },
        { code: 'LI', dial: '+423', name: 'Liechtenstein' },
        { code: 'LK', dial: '+94', name: 'Sri Lanka' },
        { code: 'LR', dial: '+231', name: 'Liberia' },
        { code: 'LS', dial: '+266', name: 'Lesotho' },
        { code: 'LT', dial: '+370', name: 'Lithuania' },
        { code: 'LU', dial: '+352', name: 'Luxembourg' },
        { code: 'LV', dial: '+371', name: 'Latvia' },
        { code: 'LY', dial: '+218', name: 'Libya' },
        { code: 'MA', dial: '+212', name: 'Morocco' },
        { code: 'MC', dial: '+377', name: 'Monaco' },
        { code: 'MD', dial: '+373', name: 'Moldova' },
        { code: 'ME', dial: '+382', name: 'Montenegro' },
        { code: 'MF', dial: '+590', name: 'Saint Martin' },
        { code: 'MG', dial: '+261', name: 'Madagascar' },
        { code: 'MH', dial: '+692', name: 'Marshall Islands' },
        { code: 'MK', dial: '+389', name: 'North Macedonia' },
        { code: 'ML', dial: '+223', name: 'Mali' },
        { code: 'MM', dial: '+95', name: 'Myanmar' },
        { code: 'MN', dial: '+976', name: 'Mongolia' },
        { code: 'MO', dial: '+853', name: 'Macao' },
        { code: 'MP', dial: '+1-670', name: 'Northern Mariana Islands' },
        { code: 'MQ', dial: '+596', name: 'Martinique' },
        { code: 'MR', dial: '+222', name: 'Mauritania' },
        { code: 'MS', dial: '+1-664', name: 'Montserrat' },
        { code: 'MT', dial: '+356', name: 'Malta' },
        { code: 'MU', dial: '+230', name: 'Mauritius' },
        { code: 'MV', dial: '+960', name: 'Maldives' },
        { code: 'MW', dial: '+265', name: 'Malawi' },
        { code: 'MX', dial: '+52', name: 'Mexico' },
        { code: 'MY', dial: '+60', name: 'Malaysia' },
        { code: 'MZ', dial: '+258', name: 'Mozambique' },
        { code: 'NA', dial: '+264', name: 'Namibia' },
        { code: 'NC', dial: '+687', name: 'New Caledonia' },
        { code: 'NE', dial: '+227', name: 'Niger' },
        { code: 'NF', dial: '+672', name: 'Norfolk Island' },
        { code: 'NG', dial: '+234', name: 'Nigeria' },
        { code: 'NI', dial: '+505', name: 'Nicaragua' },
        { code: 'NL', dial: '+31', name: 'Netherlands' },
        { code: 'NO', dial: '+47', name: 'Norway' },
        { code: 'NP', dial: '+977', name: 'Nepal' },
        { code: 'NR', dial: '+674', name: 'Nauru' },
        { code: 'NU', dial: '+683', name: 'Niue' },
        { code: 'NZ', dial: '+64', name: 'New Zealand' },
        { code: 'OM', dial: '+968', name: 'Oman' },
        { code: 'PA', dial: '+507', name: 'Panama' },
        { code: 'PE', dial: '+51', name: 'Peru' },
        { code: 'PF', dial: '+689', name: 'French Polynesia' },
        { code: 'PG', dial: '+675', name: 'Papua New Guinea' },
        { code: 'PH', dial: '+63', name: 'Philippines' },
        { code: 'PK', dial: '+92', name: 'Pakistan' },
        { code: 'PL', dial: '+48', name: 'Poland' },
        { code: 'PM', dial: '+508', name: 'Saint Pierre and Miquelon' },
        { code: 'PN', dial: '+872', name: 'Pitcairn' },
        { code: 'PR', dial: '+1-787', name: 'Puerto Rico' },
        { code: 'PS', dial: '+970', name: 'Palestine' },
        { code: 'PT', dial: '+351', name: 'Portugal' },
        { code: 'PW', dial: '+680', name: 'Palau' },
        { code: 'PY', dial: '+595', name: 'Paraguay' },
        { code: 'QA', dial: '+974', name: 'Qatar' },
        { code: 'RE', dial: '+262', name: 'Reunion' },
        { code: 'RO', dial: '+40', name: 'Romania' },
        { code: 'RS', dial: '+381', name: 'Serbia' },
        { code: 'RU', dial: '+7', name: 'Russia' },
        { code: 'RW', dial: '+250', name: 'Rwanda' },
        { code: 'SA', dial: '+966', name: 'Saudi Arabia' },
        { code: 'SB', dial: '+677', name: 'Solomon Islands' },
        { code: 'SC', dial: '+248', name: 'Seychelles' },
        { code: 'SD', dial: '+249', name: 'Sudan' },
        { code: 'SE', dial: '+46', name: 'Sweden' },
        { code: 'SG', dial: '+65', name: 'Singapore' },
        { code: 'SH', dial: '+290', name: 'Saint Helena' },
        { code: 'SI', dial: '+386', name: 'Slovenia' },
        { code: 'SJ', dial: '+47', name: 'Svalbard and Jan Mayen' },
        { code: 'SK', dial: '+421', name: 'Slovakia' },
        { code: 'SL', dial: '+232', name: 'Sierra Leone' },
        { code: 'SM', dial: '+378', name: 'San Marino' },
        { code: 'SN', dial: '+221', name: 'Senegal' },
        { code: 'SO', dial: '+252', name: 'Somalia' },
        { code: 'SR', dial: '+597', name: 'Suriname' },
        { code: 'SS', dial: '+211', name: 'South Sudan' },
        { code: 'ST', dial: '+239', name: 'Sao Tome and Principe' },
        { code: 'SV', dial: '+503', name: 'El Salvador' },
        { code: 'SX', dial: '+1-721', name: 'Sint Maarten' },
        { code: 'SY', dial: '+963', name: 'Syria' },
        { code: 'SZ', dial: '+268', name: 'Eswatini' },
        { code: 'TC', dial: '+1-649', name: 'Turks and Caicos Islands' },
        { code: 'TD', dial: '+235', name: 'Chad' },
        { code: 'TF', dial: '+262', name: 'French Southern Territories' },
        { code: 'TG', dial: '+228', name: 'Togo' },
        { code: 'TH', dial: '+66', name: 'Thailand' },
        { code: 'TJ', dial: '+992', name: 'Tajikistan' },
        { code: 'TK', dial: '+690', name: 'Tokelau' },
        { code: 'TL', dial: '+670', name: 'Timor-Leste' },
        { code: 'TM', dial: '+993', name: 'Turkmenistan' },
        { code: 'TN', dial: '+216', name: 'Tunisia' },
        { code: 'TO', dial: '+676', name: 'Tonga' },
        { code: 'TR', dial: '+90', name: 'Turkey' },
        { code: 'TT', dial: '+1-868', name: 'Trinidad and Tobago' },
        { code: 'TV', dial: '+688', name: 'Tuvalu' },
        { code: 'TW', dial: '+886', name: 'Taiwan' },
        { code: 'TZ', dial: '+255', name: 'Tanzania' },
        { code: 'UA', dial: '+380', name: 'Ukraine' },
        { code: 'UG', dial: '+256', name: 'Uganda' },
        { code: 'UM', dial: '+1', name: 'U.S. Outlying Islands' },
        { code: 'US', dial: '+1', name: 'United States' },
        { code: 'UY', dial: '+598', name: 'Uruguay' },
        { code: 'UZ', dial: '+998', name: 'Uzbekistan' },
        { code: 'VA', dial: '+39', name: 'Vatican' },
        { code: 'VC', dial: '+1-784', name: 'Saint Vincent and the Grenadines' },
        { code: 'VE', dial: '+58', name: 'Venezuela' },
        { code: 'VG', dial: '+1-284', name: 'British Virgin Islands' },
        { code: 'VI', dial: '+1-340', name: 'U.S. Virgin Islands' },
        { code: 'VN', dial: '+84', name: 'Vietnam' },
        { code: 'VU', dial: '+678', name: 'Vanuatu' },
        { code: 'WF', dial: '+681', name: 'Wallis and Futuna' },
        { code: 'WS', dial: '+685', name: 'Samoa' },
        { code: 'YE', dial: '+967', name: 'Yemen' },
        { code: 'YT', dial: '+262', name: 'Mayotte' },
        { code: 'ZA', dial: '+27', name: 'South Africa' },
        { code: 'ZM', dial: '+260', name: 'Zambia' },
        { code: 'ZW', dial: '+263', name: 'Zimbabwe' }
      ];

      const xaiGamifiedFormData = {
        name: '',
        countryCode: '+256',
        phone: '',
        email: '',
        subject: '',
        message: ''
      };

      let xaiGamifiedFormCurrentStep = 0;
      let xaiGamifiedFormIsSubmitting = false;
      let xaiGamifiedFormIsComplete = false;
      let xaiGamifiedFormShowConfetti = false;

      const xaiGamifiedFormIconPaths = {
        user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
        mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
        'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        send: '<path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9l20-7"/>',
        trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47 1-1.03 1H4.97c-.56 0-1.03-.45-1.03-1v-2.34c0-1.47.8-2.81 2.03-3.51A3.993 3.993 0 0 1 10 14.66z"/><path d="M18 14.66V17c0 .55-.47 1-1.03 1h-4.06c-.56 0-1.03-.45-1.03-1v-2.34c0-1.47.8-2.81 2.03-3.51A3.993 3.993 0 0 1 18 14.66z"/><circle cx="12" cy="10" r="2"/>',
        'check-circle-2': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
        'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
        'arrow-right': '<path d="m12 5 7 7-7 7"/><path d="M5 12h14"/>'
      };

      function xaiGamifiedFormCreateIcon(iconName) {
        const path = xaiGamifiedFormIconPaths[iconName] || xaiGamifiedFormIconPaths.user;
        return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
      }

      function xaiGamifiedFormShowToast({ title, description, variant = 'default' }) {
        const toast = document.createElement('div');
        toast.className = `xai-gamified-form-toast xai-gamified-form-${variant}`;
        toast.innerHTML = `
          <div class="xai-gamified-form-toast-title">${title}</div>
          <div class="xai-gamified-form-toast-description">${description}</div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.remove();
        }, 5000);
      }

      function xaiGamifiedFormCreateConfetti() {
        const container = document.createElement('div');
        container.className = 'xai-gamified-form-confetti-container fixed inset-0 pointer-events-none z-50';
        const colors = [
          'var(--xai-gamified-form-celebration)',
          'var(--xai-gamified-form-celebration-secondary)',
          'var(--xai-gamified-form-celebration-tertiary)',
          'var(--xai-gamified-form-primary)',
          'var(--xai-gamified-form-success)'
        ];
        const emojis = ['🎉', '🎊', '✨', '⭐', '🌟', '💫', '🎈', '🏆'];

        for (let i = 0; i < 50; i++) {
          const particle = document.createElement('div');
          particle.className = 'xai-gamified-form-confetti-particle absolute';
          const size = Math.random() * 8 + 4;
          const isEmoji = Math.random() > 0.5;
          particle.style.left = `${Math.random() * window.innerWidth}px`;
          particle.style.top = `-10px`;
          particle.style.animationDelay = `${Math.random() * 2}s`;
          particle.style.animationDuration = `${3 + Math.random() * 2}s`;

          if (isEmoji) {
            particle.innerHTML = `<span style="font-size: ${size}px;">${emojis[Math.floor(Math.random() * emojis.length)]}</span>`;
          } else {
            particle.innerHTML = `<div style="background-color: ${colors[Math.floor(Math.random() * colors.length)]}; width: ${size}px; height: ${size}px;" class="w-2 h-2 rotate-45"></div>`;
          }

          container.appendChild(particle);
        }

        document.body.appendChild(container);
        setTimeout(() => {
          container.remove();
        }, 4000);
      }

      function xaiGamifiedFormValidateStep(stepIndex) {
        const step = xaiGamifiedFormSteps[stepIndex];
        const value = xaiGamifiedFormData[step.id];

        if (step.required && !value.trim()) {
          xaiGamifiedFormShowToast({
            title: 'Oops! 🤔',
            description: `Please fill in your ${step.title.toLowerCase()}`,
            variant: 'destructive'
          });
          return false;
        }

        if (step.id === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          xaiGamifiedFormShowToast({
            title: 'Invalid Email 📧',
            description: 'Please enter a valid email address',
            variant: 'destructive'
          });
          return false;
        }

        return true;
      }

      function xaiGamifiedFormHandleNext() {
        if (!xaiGamifiedFormValidateStep(xaiGamifiedFormCurrentStep)) return;

        if (xaiGamifiedFormCurrentStep < xaiGamifiedFormSteps.length - 1) {
          xaiGamifiedFormCurrentStep++;
          xaiGamifiedFormRenderForm();
        }
      }

      function xaiGamifiedFormHandlePrevious() {
        if (xaiGamifiedFormCurrentStep > 0) {
          xaiGamifiedFormCurrentStep--;
          xaiGamifiedFormRenderForm();
        }
      }

      async function xaiGamifiedFormHandleSubmit() {
        if (!xaiGamifiedFormValidateStep(xaiGamifiedFormCurrentStep)) return;

        xaiGamifiedFormIsSubmitting = true;
        xaiGamifiedFormRenderForm();

        try {
          const formData = new FormData();
          formData.append('name', xaiGamifiedFormData.name.trim());
          formData.append('phone', xaiGamifiedFormData.countryCode + xaiGamifiedFormData.phone.trim());
          formData.append('email', xaiGamifiedFormData.email.trim());
          formData.append('subject', xaiGamifiedFormData.subject.trim());
          formData.append('message', xaiGamifiedFormData.message.trim());

          const res = await fetch('php/contactus.php', {
            method: 'POST',
            body: formData
          });
          const response = await res.json();

          if (!res.ok || response.status !== 'success') {
            throw new Error(response.message || 'Failed to send message');
          }

          xaiGamifiedFormIsComplete = true;
          xaiGamifiedFormShowConfetti = true;
          xaiGamifiedFormCreateConfetti();
          xaiGamifiedFormShowToast({
            title: 'Message sent! 🎉',
            description: response.message || 'Your message has been sent successfully!',
            variant: 'success'
          });
          setTimeout(() => {
            xaiGamifiedFormShowConfetti = false;
          }, 4000);
        } catch (error) {
          xaiGamifiedFormShowToast({
            title: 'Something went wrong 😅',
            description: error.message || 'Please try again in a moment',
            variant: 'destructive'
          });
        } finally {
          xaiGamifiedFormIsSubmitting = false;
          xaiGamifiedFormRenderForm();
        }
      }

      function xaiGamifiedFormResetForm() {
        xaiGamifiedFormCurrentStep = 0;
        xaiGamifiedFormData.name = '';
        xaiGamifiedFormData.countryCode = '+256';
        xaiGamifiedFormData.phone = '';
        xaiGamifiedFormData.email = '';
        xaiGamifiedFormData.subject = '';
        xaiGamifiedFormData.message = '';
        xaiGamifiedFormIsComplete = false;
        xaiGamifiedFormRenderForm();
      }

      function xaiGamifiedFormCreateProgressRing(progress, size = 60, strokeWidth = 4) {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (progress / 100) * circumference;

        return `
          <div class="relative">
            <svg width="${size}" height="${size}" class="xai-gamified-form-progress-ring">
              <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="var(--xai-gamified-form-progress-bg)" stroke-width="${strokeWidth}"/>
              <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="var(--xai-gamified-form-progress-fill)" stroke-width="${strokeWidth}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" style="filter: drop-shadow(0 0 6px rgba(107, 70, 193, 0.3)); transition: all 0.5s ease-out;"/>
            </svg>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 0.75rem; font-weight: 500; color: var(--xai-gamified-form-primary);">${Math.round(progress)}%</span>
            </div>
          </div>
        `;
      }

      function xaiGamifiedFormRenderForm() {
        const container = document.getElementById('xai-gamified-form-container');
        const progress = ((xaiGamifiedFormCurrentStep + 1) / xaiGamifiedFormSteps.length) * 100;

        if (xaiGamifiedFormIsComplete) {
          container.innerHTML = `
            <div class="xai-gamified-form-card xai-gamified-form-text-center xai-gamified-form-success-glow xai-gamified-form-celebration-bounce">
              <div class="xai-gamified-form-card-header">
                <div class="xai-gamified-form-form-step-icon xai-gamified-form-mx-auto xai-gamified-form-mb-4">${xaiGamifiedFormCreateIcon('trophy')}</div>
                <div class="xai-gamified-form-card-title xai-gamified-form-success">Mission Complete! 🎉</div>
              </div>
              <div class="xai-gamified-form-card-content">
                <p class="xai-gamified-form-text-muted-foreground">Your message has been sent successfully!</p>
                <div class="xai-gamified-form-space-y-2">
                  <div class="xai-gamified-form-badge xai-gamified-form-outline xai-gamified-form-celebration"><span style="margin-right: 0.25rem;">${xaiGamifiedFormCreateIcon('check-circle-2')}</span> Message Delivered</div>
                </div>
                <button class="xai-gamified-form-button xai-gamified-form-primary xai-gamified-form-w-full xai-gamified-form-mt-6" onclick="xaiGamifiedFormResetForm()">Send Another Message</button>
              </div>
            </div>
          `;
          return;
        }

        const currentStepData = xaiGamifiedFormSteps[xaiGamifiedFormCurrentStep];
        let inputField = '';

        if (currentStepData.isTextarea) {
          inputField = `<textarea class="xai-gamified-form-textarea" placeholder="${currentStepData.placeholder}" oninput="xaiGamifiedFormData['${currentStepData.id}'] = this.value" onkeydown="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); ${xaiGamifiedFormCurrentStep === xaiGamifiedFormSteps.length - 1 ? 'xaiGamifiedFormHandleSubmit()' : 'xaiGamifiedFormHandleNext()'} }">${xaiGamifiedFormData[currentStepData.id]}</textarea>`;
        } else if (currentStepData.isPhoneInput) {
          inputField = `
            <div class="xai-gamified-form-phone-input">
              <select class="xai-gamified-form-select" onchange="xaiGamifiedFormData.countryCode = this.value">
                ${xaiGamifiedFormCountryCodes.map(country => `<option value="${country.dial}" ${country.dial === xaiGamifiedFormData.countryCode ? 'selected' : ''}>${country.name} ${country.dial}</option>`).join('')}
              </select>
              <input class="xai-gamified-form-input" type="tel" placeholder="${currentStepData.placeholder}" value="${xaiGamifiedFormData.phone}" oninput="xaiGamifiedFormData.phone = this.value" onkeydown="if(event.key === 'Enter') { ${xaiGamifiedFormCurrentStep === xaiGamifiedFormSteps.length - 1 ? 'xaiGamifiedFormHandleSubmit()' : 'xaiGamifiedFormHandleNext()'} }">
            </div>
          `;
        } else {
          inputField = `<input class="xai-gamified-form-input" type="${currentStepData.id === 'email' ? 'email' : 'text'}" placeholder="${currentStepData.placeholder}" value="${xaiGamifiedFormData[currentStepData.id]}" oninput="xaiGamifiedFormData['${currentStepData.id}'] = this.value" onkeydown="if(event.key === 'Enter') { ${xaiGamifiedFormCurrentStep === xaiGamifiedFormSteps.length - 1 ? 'xaiGamifiedFormHandleSubmit()' : 'xaiGamifiedFormHandleNext()'} }">`;
        }

        container.innerHTML = `
          <div class="xai-gamified-form-card xai-gamified-form-glow-effect">
            <div class="xai-gamified-form-card-header">
              <div class="xai-gamified-form-progress-container">
                <div class="xai-gamified-form-badge xai-gamified-form-secondary">Step ${xaiGamifiedFormCurrentStep + 1} of ${xaiGamifiedFormSteps.length}</div>
                ${xaiGamifiedFormCreateProgressRing(progress)}
                <div class="xai-gamified-form-badge xai-gamified-form-outline">${Math.round(progress)}% Complete</div>
              </div>
              <div class="xai-gamified-form-card-title">${currentStepData.title}</div>
              <p class="xai-gamified-form-text-sm xai-gamified-form-text-muted-foreground">${currentStepData.subtitle}</p>
            </div>
            <div class="xai-gamified-form-card-content">
              <div class="xai-gamified-form-form-step xai-gamified-form-form-step-enter" id="xai-gamified-form-step-${xaiGamifiedFormCurrentStep}">
                <div class="xai-gamified-form-form-step-icon">${xaiGamifiedFormCreateIcon(currentStepData.icon)}</div>
                ${inputField}
                <div class="xai-gamified-form-button-group">
                  ${xaiGamifiedFormCurrentStep > 0 ? `<button class="xai-gamified-form-button xai-gamified-form-outline xai-gamified-form-flex-1" onclick="xaiGamifiedFormHandlePrevious()"><span style="margin-right: 0.5rem;">${xaiGamifiedFormCreateIcon('arrow-left')}</span> Back</button>` : ''}
                  ${xaiGamifiedFormCurrentStep === xaiGamifiedFormSteps.length - 1 ? `
                    <button class="xai-gamified-form-button xai-gamified-form-success xai-gamified-form-flex-1" onclick="xaiGamifiedFormHandleSubmit()" ${xaiGamifiedFormIsSubmitting ? 'disabled' : ''}>
                      ${xaiGamifiedFormIsSubmitting ? '<div class="xai-gamified-form-spinner"></div> Sending...' : `<span style="margin-right: 0.5rem;">${xaiGamifiedFormCreateIcon('send')}</span> Send Message`}
                    </button>
                  ` : `
                    <button class="xai-gamified-form-button xai-gamified-form-primary xai-gamified-form-flex-1" onclick="xaiGamifiedFormHandleNext()">Continue <span style="margin-left: 0.5rem;">${xaiGamifiedFormCreateIcon('arrow-right')}</span></button>
                  `}
                </div>
              </div>
            </div>
          </div>
          <div class="xai-gamified-form-progress-steps">
            ${xaiGamifiedFormSteps.map((_, index) => `<div class="xai-gamified-form-progress-step ${index <= xaiGamifiedFormCurrentStep ? 'xai-gamified-form-active' : ''}"></div>`).join('')}
          </div>
        `;

        setTimeout(() => {
          const input = document.querySelector(`#xai-gamified-form-step-${xaiGamifiedFormCurrentStep} .xai-gamified-form-input, #xai-gamified-form-step-${xaiGamifiedFormCurrentStep} .xai-gamified-form-textarea`);
          if (input) input.focus();
        }, 300);
      }

      // Expose functions to global scope with unique names
      window.xaiGamifiedFormHandleNext = xaiGamifiedFormHandleNext;
      window.xaiGamifiedFormHandlePrevious = xaiGamifiedFormHandlePrevious;
      window.xaiGamifiedFormHandleSubmit = xaiGamifiedFormHandleSubmit;
      window.xaiGamifiedFormResetForm = xaiGamifiedFormResetForm;

      xaiGamifiedFormRenderForm();
    })();