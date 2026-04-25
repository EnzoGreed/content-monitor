from .models import Keyword, ContentItem, Flag

def scan_content(content_item):
    keywords = Keyword.objects.all()
    flags_created = []

    for keyword in keywords:
        text = f"{content_item.title} {content_item.body}".lower()
        keyword_text = keyword.name.lower()
        count = text.count(keyword_text)

        if count > 0:
            flag, created = Flag.objects.get_or_create(
                keyword=keyword,
                content_item=content_item,
                defaults={'score': count, 'status': 'pending'}
            )

            if not created:
                # Flag already exists — check suppression logic
                if flag.status == 'irrelevant':
                    # Was the content updated after the reviewer dismissed it?
                    if (flag.reviewed_at and 
                        content_item.last_updated > flag.reviewed_at):
                        # Content changed — reset the flag
                        flag.status = 'pending'
                        flag.score = count
                        flag.reviewed_at = None
                        flag.save()
                        flags_created.append(flag)
                    else:
                        # Still suppressed — skip it
                        continue
                else:
                    # Not suppressed — update score normally
                    flag.score = count
                    flag.save()
                    flags_created.append(flag)
            else:
                flags_created.append(flag)

    return flags_created