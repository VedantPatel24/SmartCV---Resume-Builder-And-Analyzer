class ResumeLayoutEngine:
    def __init__(self, data):
        self.name = data.get("name", "")
        self.phone = data.get("phone", "")
        self.email = data.get("email", "")
        self.github = data.get("github", "")
        self.linkedin = data.get("linkedin", "")
        self.education = data.get("education", "")
        self.cgpa = data.get("cgpa", "")
        self.skills = data.get("skills", "")
        self.projects = data.get("projects", [])
        self.certifications = data.get("certifications", [])
        
        # A4 dimensions (points)
        self.width = 595.276
        self.height = 841.890
        self.margin_left = 50
        self.margin_right = 50
        self.margin_top = 50
        
    def get_layout_data(self):
        """Return layout data that both Canvas and HTML5 Canvas can use"""
        layout_data = {
            'page': {
                'width': self.width,
                'height': self.height,
                'margin_left': self.margin_left,
                'margin_right': self.margin_right,
                'margin_top': self.margin_top
            },
            'sections': []
        }
        
        # Start from top of page (top-down coordinates)
        y_position = self.margin_top
        
        # Header Section
        if self.name:
            layout_data['sections'].append({
                'type': 'header',
                'position': {'x': self.width / 2, 'y': y_position},
                'content': self.name,
                'font': 'Helvetica-Bold',
                'size': 28,
                'color': '#1e40af',
                'align': 'center',
                'text_anchor': 'middle'
            })
            y_position += 40
        
        # Contact Information
        contact_items = []
        if self.phone:
            contact_items.append(f"📞 {self.phone}")
        if self.email:
            contact_items.append(f"✉ {self.email}")
        if self.github:
            contact_items.append(f"🐙 GitHub")
        if self.linkedin:
            contact_items.append(f"🔗 LinkedIn")
        
        if contact_items:
            contact_text = "    ".join(contact_items)
            layout_data['sections'].append({
                'type': 'contact',
                'position': {'x': self.width / 2, 'y': y_position},
                'content': contact_text,
                'font': 'Helvetica',
                'size': 11,
                'color': '#64748b',
                'align': 'center',
                'text_anchor': 'middle'
            })
            y_position += 30
            
            # Links section
            if self.github or self.linkedin:
                y_position += 15
                current_x = self.width / 2
                for item in contact_items:
                    if "GitHub" in item and self.github:
                        layout_data['sections'].append({
                            'type': 'link',
                            'position': {'x': current_x, 'y': y_position},
                            'content': 'GitHub',
                            'font': 'Helvetica',
                            'size': 10,
                            'color': '#3b82f6',
                            'align': 'left',
                            'text_anchor': 'start',
                            'url': self.github
                        })
                        current_x += 60
                    elif "LinkedIn" in item and self.linkedin:
                        layout_data['sections'].append({
                            'type': 'link',
                            'position': {'x': current_x, 'y': y_position},
                            'content': 'LinkedIn',
                            'font': 'Helvetica',
                            'size': 10,
                            'color': '#3b82f6',
                            'align': 'left',
                            'text_anchor': 'start',
                            'url': self.linkedin
                        })
                        current_x += 60
        
        y_position += 30
        
        # Education Section
        if self.education:
            y_position = self._add_section_header(layout_data, 'EDUCATION', y_position)
            
            for line in self.education.strip().split("\n"):
                if line.strip():
                    layout_data['sections'].append({
                        'type': 'text',
                        'position': {'x': self.margin_left, 'y': y_position},
                        'content': line.strip(),
                        'font': 'Helvetica',
                        'size': 12,
                        'color': '#000000',
                        'align': 'left',
                        'text_anchor': 'start'
                    })
                    y_position += 16
            
            y_position += 10
            
            # CGPA Section
            if self.cgpa:
                layout_data['sections'].append({
                    'type': 'text',
                    'position': {'x': self.margin_left, 'y': y_position},
                    'content': 'Academic Performance:',
                    'font': 'Helvetica-Bold',
                    'size': 12,
                    'color': '#1e40af',
                    'align': 'left',
                    'text_anchor': 'start'
                })
                y_position += 20
                
                for line in self.cgpa.strip().split("\n"):
                    if line.strip():
                        layout_data['sections'].append({
                            'type': 'text',
                            'position': {'x': self.margin_left + 10, 'y': y_position},
                            'content': f"• {line.strip()}",
                            'font': 'Helvetica',
                            'size': 11,
                            'color': '#000000',
                            'align': 'left',
                            'text_anchor': 'start'
                        })
                        y_position += 16
                
                y_position += 20
        
        # Skills Section
        if self.skills:
            y_position = self._add_section_header(layout_data, 'TECHNICAL SKILLS', y_position)
            
            for line in self.skills.strip().split("\n"):
                if ":" in line:
                    category, items = line.split(":", 1)
                    layout_data['sections'].append({
                        'type': 'text',
                        'position': {'x': self.margin_left, 'y': y_position},
                        'content': f"{category.strip()}:",
                        'font': 'Helvetica-Bold',
                        'size': 12,
                        'color': '#1e40af',
                        'align': 'left',
                        'text_anchor': 'start'
                    })
                    y_position += 18
                    
                    skills_list = [skill.strip() for skill in items.split(",") if skill.strip()]
                    skills_text = " • ".join(skills_list)
                    
                    if len(skills_text) > 80:
                        # Handle long skill lists
                        words = skills_list
                        lines = []
                        current_line = []
                        current_length = 0
                        
                        for word in words:
                            if current_length + len(word) + 3 > 80:
                                lines.append(" • ".join(current_line))
                                current_line = [word]
                                current_length = len(word)
                            else:
                                current_line.append(word)
                                current_length += len(word) + 3
                        
                        if current_line:
                            lines.append(" • ".join(current_line))
                        
                        for line in lines:
                            layout_data['sections'].append({
                                'type': 'text',
                                'position': {'x': self.margin_left + 10, 'y': y_position},
                                'content': line,
                                'font': 'Helvetica',
                                'size': 11,
                                'color': '#000000',
                                'align': 'left',
                                'text_anchor': 'start'
                            })
                            y_position += 16
                    else:
                        layout_data['sections'].append({
                            'type': 'text',
                            'position': {'x': self.margin_left + 10, 'y': y_position},
                            'content': skills_text,
                            'font': 'Helvetica',
                            'size': 11,
                            'color': '#000000',
                            'align': 'left',
                            'text_anchor': 'start'
                        })
                        y_position += 16
                elif line.strip():
                    layout_data['sections'].append({
                        'type': 'text',
                        'position': {'x': self.margin_left, 'y': y_position},
                        'content': f"• {line.strip()}",
                        'font': 'Helvetica',
                        'size': 11,
                        'color': '#000000',
                        'align': 'left',
                        'text_anchor': 'start'
                    })
                    y_position += 16
            
            y_position += 20
        
        # Certifications Section
        if self.certifications:
            y_position = self._add_section_header(layout_data, 'CERTIFICATIONS', y_position)
            
            for cert in self.certifications:
                title = cert.get("title", "")
                provider = cert.get("provider", "")
                link = cert.get("link", "")
                
                cert_text = f"• {title}"
                if provider:
                    cert_text += f" - {provider}"
                
                layout_data['sections'].append({
                    'type': 'text',
                    'position': {'x': self.margin_left, 'y': y_position},
                    'content': cert_text,
                    'font': 'Helvetica',
                    'size': 11,
                    'color': '#000000',
                    'align': 'left',
                    'text_anchor': 'start'
                })
                y_position += 16
                
                if link:
                    layout_data['sections'].append({
                        'type': 'text',
                        'position': {'x': self.margin_left + 10, 'y': y_position},
                        'content': '🔗 View Certificate',
                        'font': 'Helvetica-Oblique',
                        'size': 10,
                        'color': '#3b82f6',
                        'align': 'left',
                        'text_anchor': 'start',
                        'url': link
                    })
                    y_position += 14
                
                y_position += 20
        
        # Projects Section
        if self.projects:
            y_position = self._add_section_header(layout_data, 'PROJECTS', y_position)
            
            for proj in self.projects:
                title = proj.get("title", "")
                desc = proj.get("description", "")
                link = proj.get("link", "")
                
                layout_data['sections'].append({
                    'type': 'text',
                    'position': {'x': self.margin_left, 'y': y_position},
                    'content': f"• {title}",
                    'font': 'Helvetica-Bold',
                    'size': 13,
                    'color': '#1e40af',
                    'align': 'left',
                    'text_anchor': 'start'
                })
                y_position += 18
                
                # Handle project description
                desc_lines = desc.strip().split("\n")
                for line in desc_lines:
                    if line.strip():
                        if len(line) > 100:
                            # Wrap long lines
                            words = line.split()
                            current_line = ""
                            for word in words:
                                if len(current_line + " " + word) <= 100:
                                    current_line += (" " + word) if current_line else word
                                else:
                                    layout_data['sections'].append({
                                        'type': 'text',
                                        'position': {'x': self.margin_left + 10, 'y': y_position},
                                        'content': current_line,
                                        'font': 'Helvetica',
                                        'size': 11,
                                        'color': '#000000',
                                        'align': 'left',
                                        'text_anchor': 'start'
                                    })
                                    y_position += 14
                                    current_line = word
                            if current_line:
                                layout_data['sections'].append({
                                    'type': 'text',
                                    'position': {'x': self.margin_left + 10, 'y': y_position},
                                    'content': current_line,
                                    'font': 'Helvetica',
                                    'size': 11,
                                    'color': '#000000',
                                    'align': 'left',
                                    'text_anchor': 'start'
                                })
                                y_position += 14
                        else:
                            layout_data['sections'].append({
                                'type': 'text',
                                'position': {'x': self.margin_left + 10, 'y': y_position},
                                'content': line.strip(),
                                'font': 'Helvetica',
                                'size': 11,
                                'color': '#000000',
                                'align': 'left',
                                'text_anchor': 'start'
                            })
                            y_position += 14
                
                # Project link
                if link:
                    layout_data['sections'].append({
                        'type': 'text',
                        'position': {'x': self.margin_left + 10, 'y': y_position},
                        'content': '🔗 View Project',
                        'font': 'Helvetica-Oblique',
                        'size': 10,
                        'color': '#3b82f6',
                        'align': 'left',
                        'text_anchor': 'start',
                        'url': link
                    })
                    y_position += 14
                
                y_position += 20
        
        return layout_data
    
    def _add_section_header(self, layout_data, title, y_position):
        """Add a section header and return the new y position"""
        layout_data['sections'].append({
            'type': 'section_header',
            'position': {'x': self.margin_left, 'y': y_position},
            'content': title,
            'font': 'Helvetica-Bold',
            'size': 16,
            'color': '#1e40af',
            'align': 'left',
            'text_anchor': 'start'
        })
        
        # Add underline
        layout_data['sections'].append({
            'type': 'line',
            'position': {'x': self.margin_left, 'y': y_position + 5},
            'end_position': {'x': self.margin_left + 200, 'y': y_position + 5},
            'color': '#1e40af',
            'width': 2
        })
        
        return y_position + 25
